package config

import (
	"backend/internal/models"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDB() *gorm.DB {
	dsn := "root:root@tcp(127.0.0.1:3306)/taskflow_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Gagal terhubung ke MySQL: %v", err)
	}

	// Auto Migration membuat tabel sesuai struct secara otomatis
	err = db.AutoMigrate(
		&models.Task{},
		&models.Transaction{},
		&models.Bill{},
		&models.Setting{},
	)
	if err != nil {
		log.Fatalf("Migrasi database gagal: %v", err)
	}

	// Inisialisasi key wa_number default jika belum ada
	var setting models.Setting
	if err := db.Where("setting_key = ?", "wa_number").First(&setting).Error; err != nil {
		db.Create(&models.Setting{Key: "wa_number", Value: ""})
	}

	return db
}
