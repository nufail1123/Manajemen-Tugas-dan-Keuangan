package main

import (
	"backend/config"
	"backend/internal/handlers"
	"backend/internal/services"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	db := config.ConnectDB()

	// Menjalankan cron job di background
	services.StartScheduler(db)

	app := fiber.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET, POST, PATCH, PUT, DELETE, OPTIONS",
	}))

	taskHandler := &handlers.TaskHandler{DB: db}
	txHandler := &handlers.TransactionHandler{DB: db}
	billHandler := &handlers.BillHandler{DB: db}
	settingHandler := &handlers.SettingHandler{DB: db}

	// Task Routes
	app.Get("/api/tasks", taskHandler.GetAll)
	app.Post("/api/tasks", taskHandler.Create)
	app.Patch("/api/tasks/:id", taskHandler.Update)
	app.Delete("/api/tasks/:id", taskHandler.Delete)

	// Transaction Routes
	app.Get("/api/transactions", txHandler.GetAll)
	app.Post("/api/transactions", txHandler.Create)
	app.Patch("/api/transactions/:id", txHandler.Update)
	app.Delete("/api/transactions/:id", txHandler.Delete)

	// Bill Routes
	app.Get("/api/bills", billHandler.GetAll)
	app.Post("/api/bills", billHandler.Create)
	app.Patch("/api/bills/:id", billHandler.Update)
	app.Delete("/api/bills/:id", billHandler.Delete)

	// Settings Routes
	app.Get("/api/settings/wa", settingHandler.GetWa)
	app.Put("/api/settings/wa", settingHandler.UpdateWa)

	app.Get("/api/finance/summary", txHandler.GetSummary)

	// Memulai server Fiber (memblokir proses agar tetap berjalan)
	log.Fatal(app.Listen(":8088"))
}
