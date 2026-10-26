package handlers

import (
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BillHandler struct {
	DB *gorm.DB
}

func (h *BillHandler) GetAll(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var bills []models.Bill
	if err := h.DB.Where("user_id = ?", userID).Find(&bills).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(bills)
}

func (h *BillHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var bill models.Bill
	if err := c.BodyParser(&bill); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	bill.ID = uuid.New().String()
	bill.UserID = userID // Wajib diisi

	if err := h.DB.Create(&bill).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(bill)
}

func (h *BillHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	res := h.DB.Model(&models.Bill{}).Where("id = ? AND user_id = ?", id, userID).Updates(payload)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Tagihan tidak ditemukan"})
	}

	return c.SendStatus(204)
}

func (h *BillHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	res := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Bill{})
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Tagihan tidak ditemukan"})
	}

	return c.SendStatus(204)
}
