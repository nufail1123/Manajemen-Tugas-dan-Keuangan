package handlers

import (
	"backend/internal/models"
	"strings"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SettingHandler struct {
	DB *gorm.DB
}

func (h *SettingHandler) GetWa(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var setting models.UserSetting
	if err := h.DB.Where("user_id = ?", userID).First(&setting).Error; err != nil {
		return c.JSON(fiber.Map{"waNumber": ""})
	}
	return c.JSON(fiber.Map{"waNumber": setting.WaNumber})
}

func (h *SettingHandler) UpdateWa(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	type WaReq struct {
		WaNumber string `json:"waNumber"`
	}
	var req WaReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	cleanPhone := strings.TrimSpace(req.WaNumber)
	if strings.HasPrefix(cleanPhone, "+62") {
		cleanPhone = cleanPhone[1:]
	} else if strings.HasPrefix(cleanPhone, "0") {
		cleanPhone = "62" + cleanPhone[1:]
	}

	setting := models.UserSetting{
		UserID:   userID,
		WaNumber: cleanPhone,
	}

	if err := h.DB.Save(&setting).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal menyimpan nomor WA"})
	}

	return c.JSON(fiber.Map{"waNumber": cleanPhone})
}
