package main

import (
	"backend/config"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	db := config.ConnectDB()
	services.StartScheduler(db)

	app := fiber.New()
	app.Use(cors.New())

	authHandler := &handlers.AuthHandler{DB: db}
	taskHandler := &handlers.TaskHandler{DB: db}
	txHandler := &handlers.TransactionHandler{DB: db}
	billHandler := &handlers.BillHandler{DB: db}
	settingHandler := &handlers.SettingHandler{DB: db}
	catHandler := &handlers.TaskCategoryHandler{DB: db}

	// 1. Rute Publik (Auth)
	auth := app.Group("/api/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// 2. Rute Terproteksi JWT
	api := app.Group("/api", middleware.Protected())

	// Sub-rute Auth terproteksi
	api.Get("/auth/me", authHandler.Me)
	api.Post("/auth/logout", authHandler.Logout)
	api.Delete("/auth/me", authHandler.DeleteAccount)

	// Tasks
	api.Get("/tasks", taskHandler.GetAll)
	api.Post("/tasks", taskHandler.Create)
	api.Patch("/tasks/:id", taskHandler.Update)
	api.Delete("/tasks/:id", taskHandler.Delete)

	// Transactions & Summary
	api.Get("/transactions", txHandler.GetAll)
	api.Post("/transactions", txHandler.Create)
	api.Patch("/transactions/:id", txHandler.Update)
	api.Delete("/transactions/:id", txHandler.Delete)
	api.Get("/finance/summary", txHandler.GetSummary)

	// Bills
	api.Get("/bills", billHandler.GetAll)
	api.Post("/bills", billHandler.Create)
	api.Patch("/bills/:id", billHandler.Update)
	api.Delete("/bills/:id", billHandler.Delete)

	// WA Settings
	api.Get("/settings/wa", settingHandler.GetWa)
	api.Put("/settings/wa", settingHandler.UpdateWa)

	// Task Categories
	api.Get("/task-categories", catHandler.GetAll)
	api.Post("/task-categories", catHandler.Create)
	api.Delete("/task-categories/:id", catHandler.Delete)

	app.Listen(":8088")
}
