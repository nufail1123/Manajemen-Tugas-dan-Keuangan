package handlers

import (
	"backend/internal/models"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskHandler struct {
	DB *gorm.DB
}

func (h *TaskHandler) GetAll(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string) // Ambil ID dari token JWT

	var tasks []models.Task
	if err := h.DB.Where("user_id = ?", userID).Order("due_date ASC").Find(&tasks).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(tasks)
}

func (h *TaskHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var task models.Task
	if err := c.BodyParser(&task); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	if strings.TrimSpace(task.Title) == "" || strings.TrimSpace(task.DueDate) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title dan dueDate wajib diisi"})
	}

	// Validasi kategori wajib ada di task_categories milik user
	var cat models.TaskCategory
	if err := h.DB.Where("user_id = ? AND LOWER(name) = LOWER(?)", userID, strings.TrimSpace(task.Category)).First(&cat).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Kategori tidak ditemukan"})
	}
	task.Category = cat.Name // Simpan nama kanonik

	task.ID = uuid.New().String()
	task.UserID = userID

	if err := h.DB.Create(&task).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(task)
}

func (h *TaskHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	updates := make(map[string]interface{})
	for k, v := range body {
		switch k {
		case "title":
			updates["title"] = v
		case "description":
			updates["description"] = v
		case "category":
			// Validasi jika category disertakan di PATCH
			catStr, ok := v.(string)
			if !ok || strings.TrimSpace(catStr) == "" {
				return c.Status(400).JSON(fiber.Map{"error": "Kategori tidak valid"})
			}
			var cat models.TaskCategory
			if err := h.DB.Where("user_id = ? AND LOWER(name) = LOWER(?)", userID, strings.TrimSpace(catStr)).First(&cat).Error; err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Kategori tidak ditemukan"})
			}
			updates["category"] = cat.Name
		case "url":
			updates["url"] = v
		case "dueDate":
			updates["due_date"] = v
		case "remindH3":
			updates["remind_h3"] = v
		case "remindH1":
			updates["remind_h1"] = v
		case "done":
			updates["done"] = v
		}
	}

	res := h.DB.Model(&models.Task{}).Where("id = ? AND user_id = ?", id, userID).Updates(updates)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Tugas tidak ditemukan"})
	}

	return c.SendStatus(204)
}
func (h *TaskHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	res := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Task{})
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Tugas tidak ditemukan"})
	}

	return c.SendStatus(204)
}
