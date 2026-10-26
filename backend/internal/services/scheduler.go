package services

import (
	"backend/internal/models"
	"fmt"
	"time"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

func StartScheduler(db *gorm.DB) {
	c := cron.New()

	// Dijalankan setiap hari pukul 08:00 pagi
	c.AddFunc("0 8 * * *", func() {
		var setting models.Setting
		if err := db.Where("setting_key = ?", "wa_number").First(&setting).Error; err != nil || setting.Value == "" {
			return
		}

		// Pengingat Tugas
		checkTasks(db, 3, "remind_h3", "notified_h3", "H-3", setting.Value)
		checkTasks(db, 1, "remind_h1", "notified_h1", "H-1 (Besok)", setting.Value)

		// Pengingat Tagihan Rutin
		checkBills(db, 3, "remind_h3", "H-3", setting.Value)
		checkBills(db, 1, "remind_h1", "H-1 (Besok)", setting.Value)
	})

	c.Start()
}

func checkTasks(db *gorm.DB, intervalDays int, activeCol, flagCol, label, phone string) {
	var tasks []models.Task

	// Menyesuaikan query agar mengecek opsi remind_h3 / remind_h1 yang aktif
	queryCondition := fmt.Sprintf("done = FALSE AND %s = TRUE AND %s = FALSE AND due_date = CURDATE() + INTERVAL ? DAY", activeCol, flagCol)
	db.Where(queryCondition, intervalDays).Find(&tasks)

	for _, task := range tasks {
		msg := fmt.Sprintf("🔔 *PENGINGAT TUGAS (%s)*\n\n*Judul:* %s\n*Batas Waktu:* %s\n*Link:* %s",
			label, task.Title, task.DueDate, task.URL)

		if SendWhatsApp(phone, msg) {
			db.Model(&task).Update(flagCol, true)
		}
	}
}

func checkBills(db *gorm.DB, intervalDays int, activeCol, label, phone string) {
	// Menghitung target tanggal jatuh tempo tagihan di bulan berjalan
	targetDate := time.Now().AddDate(0, 0, intervalDays).Day()

	var bills []models.Bill
	queryCondition := fmt.Sprintf("%s = TRUE AND day = ?", activeCol)
	db.Where(queryCondition, targetDate).Find(&bills)

	for _, bill := range bills {
		msg := fmt.Sprintf("💳 *PENGINGAT TAGIHAN (%s)*\n\n*Nama Tagihan:* %s\n*Nominal:* Rp %d\n*Tanggal Jatuh Tempo:* Tanggal %d\n\nSegera lakukan pembayaran sebelum jatuh tempo!",
			label, bill.Name, bill.Amount, bill.Day)

		SendWhatsApp(phone, msg)
	}
}
