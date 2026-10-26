package handlers

import (
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	DB *gorm.DB
}

func (h *TransactionHandler) GetAll(c *fiber.Ctx) error {
	month := c.Query("month") // misal: "2026-10"
	query := h.DB.Order("date DESC")

	if month != "" {
		query = query.Where("date LIKE ?", month+"%")
	}

	var transactions []models.Transaction
	if err := query.Find(&transactions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(transactions)
}

func (h *TransactionHandler) Create(c *fiber.Ctx) error {
	var tx models.Transaction
	if err := c.BodyParser(&tx); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	tx.ID = uuid.New().String()
	if err := h.DB.Create(&tx).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(tx)
}

func (h *TransactionHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.DB.Delete(&models.Transaction{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
func (h *TransactionHandler) GetSummary(c *fiber.Ctx) error {
	month := c.Query("month")

	var totalIncome, totalExpense int64

	incomeQuery := h.DB.Model(&models.Transaction{}).Where("type = ?", "income")
	expenseQuery := h.DB.Model(&models.Transaction{}).Where("type = ?", "expense")

	if month != "" {
		incomeQuery = incomeQuery.Where("date LIKE ?", month+"%")
		expenseQuery = expenseQuery.Where("date LIKE ?", month+"%")
	}

	incomeQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalIncome)
	expenseQuery.Select("COALESCE(SUM(amount), 0)").Scan(&totalExpense)

	balance := totalIncome - totalExpense

	return c.JSON(fiber.Map{
		"balance":      balance,
		"totalIncome":  totalIncome,
		"totalExpense": totalExpense,
	})
}

func (h *TransactionHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	if err := h.DB.Model(&models.Transaction{}).Where("id = ?", id).Updates(payload).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
