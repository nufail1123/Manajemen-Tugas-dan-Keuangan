package main

import (
	"backend/config"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/services"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/joho/godotenv"
)

func validateEnv() {
	isProd := os.Getenv("APP_ENV") == "production"
	captchaEnabled := os.Getenv("RECAPTCHA_ENABLED") != "false"
	captchaSecret := os.Getenv("RECAPTCHA_SECRET")

	if isProd && !captchaEnabled {
		log.Fatal("FATAL: RECAPTCHA_ENABLED tidak boleh nonaktif di production")
	}
	if captchaEnabled && captchaSecret == "" {
		log.Fatal("FATAL: RECAPTCHA_SECRET wajib diisi saat reCAPTCHA diaktifkan")
	}
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Peringatan: File .env tidak ditemukan, menggunakan variabel sistem")
	}
	// 1. Validasi konfigurasi environment
	validateEnv()

	// 2. Inisialisasi koneksi database & scheduler
	db := config.ConnectDB()
	services.StartScheduler(db)

	app := fiber.New()
	app.Use(cors.New())

	// 3. Inisialisasi Handlers
	authHandler := &handlers.AuthHandler{DB: db}
	taskHandler := &handlers.TaskHandler{DB: db}
	txHandler := &handlers.TransactionHandler{DB: db}
	billHandler := &handlers.BillHandler{DB: db}
	settingHandler := &handlers.SettingHandler{DB: db}
	catHandler := &handlers.TaskCategoryHandler{DB: db}

	// 4. Rate Limiter khusus registrasi (5 request per menit per IP)
	registerLimiter := limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Terlalu banyak percobaan, coba lagi nanti.",
			})
		},
	})

	// 5. Rute Publik (Auth)
	auth := app.Group("/api/auth")
	auth.Post("/register", registerLimiter, authHandler.Register)
	auth.Post("/login", authHandler.Login)

	// 6. Rute Terproteksi JWT
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

	// Transactions & Finance Summary
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

	// WhatsApp Settings
	api.Get("/settings/wa", settingHandler.GetWa)
	api.Put("/settings/wa", settingHandler.UpdateWa)

	// Task Categories
	api.Get("/task-categories", catHandler.GetAll)
	api.Post("/task-categories", catHandler.Create)
	api.Delete("/task-categories/:id", catHandler.Delete)

	// 7. Jalankan server
	log.Fatal(app.Listen("0.0.0.0:8088"))
}
