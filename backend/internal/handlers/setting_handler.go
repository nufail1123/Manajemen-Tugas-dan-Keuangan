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
	var setting models.Setting
	h.DB.Where("setting_key = ?", "wa_number").First(&setting)
	return c.JSON(models.WaSettingResponse{WaNumber: setting.Value})
}

func (h *SettingHandler) UpdateWa(c *fiber.Ctx) error {
	var req models.WaSettingResponse
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	// Normalisasi otomatis jika diawali '0' atau '+62'
	cleanPhone := strings.TrimSpace(req.WaNumber)
	if strings.HasPrefix(cleanPhone, "+62") {
		cleanPhone = cleanPhone[1:]
	} else if strings.HasPrefix(cleanPhone, "0") {
		cleanPhone = "62" + cleanPhone[1:]
	}
	req.WaNumber = cleanPhone

	h.DB.Model(&models.Setting{}).Where("setting_key = ?", "wa_number").Update("value", req.WaNumber)
	return c.JSON(req)
}
