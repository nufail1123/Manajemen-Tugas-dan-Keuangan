package handlers

import (
	"backend/internal/models"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/go-sql-driver/mysql"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskCategoryHandler struct {
	DB *gorm.DB
}

// GET /api/task-categories
func (h *TaskCategoryHandler) GetAll(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var categories []models.TaskCategory
	if err := h.DB.Where("user_id = ?", userID).Order("created_at ASC, id ASC").Find(&categories).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal mengambil data kategori"})
	}
	return c.JSON(categories)
}

// POST /api/task-categories
func (h *TaskCategoryHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	type CreateReq struct {
		Name string `json:"name"`
		Tone string `json:"tone"`
	}

	var req CreateReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Data tidak lengkap"})
	}

	// 1. Ratakan spasi
	cleanedName := strings.Join(strings.Fields(strings.TrimSpace(req.Name)), " ")
	nameLength := utf8.RuneCountInString(cleanedName)

	if nameLength < 2 || nameLength > 24 {
		return c.Status(400).JSON(fiber.Map{"error": "Nama kategori 2-24 karakter"})
	}

	// 2. Cek kata "Semua"
	if strings.EqualFold(cleanedName, "semua") {
		return c.Status(400).JSON(fiber.Map{"error": `Nama "Semua" tidak boleh dipakai`})
	}

	// 3. Validasi tone
	tone := strings.TrimSpace(strings.ToLower(req.Tone))
	if tone == "" {
		tone = "neutral"
	}
	validTones := map[string]bool{"primary": true, "secondary": true, "tertiary": true, "neutral": true}
	if !validTones[tone] {
		return c.Status(400).JSON(fiber.Map{"error": "Warna tidak valid"})
	}

	newCat := models.TaskCategory{
		ID:     uuid.New().String(),
		UserID: userID,
		Name:   cleanedName,
		Tone:   tone,
	}

	// 4. Hitung batas 20 dan simpan dalam satu transaksi
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&models.TaskCategory{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
			return err
		}
		if count >= 20 {
			return fiber.NewError(fiber.StatusConflict, "Maksimal 20 kategori")
		}

		if err := tx.Create(&newCat).Error; err != nil {
			// Tangkap duplikasi unique index di MySQL (error code 1062)
			if mysqlErr, ok := err.(*mysql.MySQLError); ok && mysqlErr.Number == 1062 {
				return fiber.NewError(fiber.StatusConflict, "Kategori sudah ada")
			}
			return err
		}
		return nil
	})

	if err != nil {
		if fErr, ok := err.(*fiber.Error); ok {
			return c.Status(fErr.Code).JSON(fiber.Map{"error": fErr.Message})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan kategori"})
	}

	return c.Status(201).JSON(newCat)
}

// DELETE /api/task-categories/:id
func (h *TaskCategoryHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var cat models.TaskCategory
		if err := tx.Where("id = ? AND user_id = ?", id, userID).First(&cat).Error; err != nil {
			return fiber.NewError(fiber.StatusNotFound, "Kategori tidak ditemukan")
		}

		// Hitung pemakaian pada tasks
		var taskCount int64
		if err := tx.Model(&models.Task{}).Where("user_id = ? AND LOWER(category) = LOWER(?)", userID, cat.Name).Count(&taskCount).Error; err != nil {
			return err
		}

		if taskCount > 0 {
			return fiber.NewError(fiber.StatusConflict, fmt.Sprintf("Kategori masih dipakai %d tugas", taskCount))
		}

		return tx.Delete(&cat).Error
	})

	if err != nil {
		if fErr, ok := err.(*fiber.Error); ok {
			return c.Status(fErr.Code).JSON(fiber.Map{"error": fErr.Message})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menghapus kategori"})
	}

	return c.SendStatus(204)
}
