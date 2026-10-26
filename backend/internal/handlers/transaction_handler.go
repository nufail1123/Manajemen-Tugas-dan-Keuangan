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
	userID := c.Locals("userID").(string)
	month := c.Query("month")
	category := c.Query("category")
	search := c.Query("q")

	query := h.DB.Where("user_id = ?", userID).Order("date DESC")

	if month != "" {
		query = query.Where("date LIKE ?", month+"%")
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if search != "" {
		query = query.Where("description LIKE ?", "%"+search+"%")
	}

	var transactions []models.Transaction
	if err := query.Find(&transactions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(transactions)
}

func (h *TransactionHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var tx models.Transaction
	if err := c.BodyParser(&tx); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	tx.ID = uuid.New().String()
	tx.UserID = userID // Wajib diisi

	if err := h.DB.Create(&tx).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(tx)
}

func (h *TransactionHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	res := h.DB.Model(&models.Transaction{}).Where("id = ? AND user_id = ?", id, userID).Updates(payload)
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Transaksi tidak ditemukan"})
	}

	return c.SendStatus(204)
}

func (h *TransactionHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	res := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Transaction{})
	if res.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": res.Error.Error()})
	}
	if res.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Transaksi tidak ditemukan"})
	}

	return c.SendStatus(204)
}

func (h *TransactionHandler) GetSummary(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	month := c.Query("month")

	var totalIncome, totalExpense int64

	incomeQuery := h.DB.Model(&models.Transaction{}).Where("user_id = ? AND type = ?", userID, "income")
	expenseQuery := h.DB.Model(&models.Transaction{}).Where("user_id = ? AND type = ?", userID, "expense")

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
		"income":       totalIncome,
		"expense":      totalExpense,
	})
}
