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
	var tasks []models.Task
	if err := h.DB.Order("due_date ASC").Find(&tasks).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(tasks)
}

func (h *TaskHandler) Create(c *fiber.Ctx) error {
	var task models.Task
	if err := c.BodyParser(&task); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	// Validasi input kosong agar tidak error 500
	if strings.TrimSpace(task.Title) == "" || strings.TrimSpace(task.DueDate) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title dan dueDate wajib diisi"})
	}

	task.ID = uuid.New().String()
	if err := h.DB.Create(&task).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(task)
}

func (h *TaskHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Payload invalid"})
	}

	// Mapping eksplisit dari JSON camelCase ke nama kolom database MySQL
	updates := make(map[string]interface{})
	for k, v := range body {
		switch k {
		case "title":
			updates["title"] = v
		case "description":
			updates["description"] = v
		case "category":
			updates["category"] = v
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

	if len(updates) > 0 {
		if err := h.DB.Model(&models.Task{}).Where("id = ?", id).Updates(updates).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.SendStatus(204)
}

func (h *TaskHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.DB.Delete(&models.Task{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(204)
}
