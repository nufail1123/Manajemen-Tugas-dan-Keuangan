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
	var bills []models.Bill
	if err := h.DB.Order("day ASC").Find(&bills).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(bills)
}

func (h *BillHandler) Create(c *fiber.Ctx) error {
	var bill models.Bill
	if err := c.BodyParser(&bill); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	bill.ID = uuid.New().String()
	if err := h.DB.Create(&bill).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(bill)
}

func (h *BillHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.DB.Delete(&models.Bill{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}

func (h *BillHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	if err := h.DB.Model(&models.Bill{}).Where("id = ?", id).Updates(payload).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
