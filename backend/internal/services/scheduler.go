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

	c.AddFunc("0 8 * * *", func() {
		var userSettings []models.UserSetting
		// Hanya ambil pengguna yang telah mengisi nomor WhatsApp
		if err := db.Where("wa_number != ''").Find(&userSettings).Error; err != nil {
			return
		}

		for _, us := range userSettings {
			// Pengingat Tugas per user
			checkUserTasks(db, us.UserID, 3, "remind_h3", "notified_h3", "H-3", us.WaNumber)
			checkUserTasks(db, us.UserID, 1, "remind_h1", "notified_h1", "H-1 (Besok)", us.WaNumber)

			// Pengingat Tagihan per user
			checkUserBills(db, us.UserID, 3, "remind_h3", "H-3", us.WaNumber)
			checkUserBills(db, us.UserID, 1, "remind_h1", "H-1 (Besok)", us.WaNumber)
		}
	})

	c.Start()
}

func checkUserTasks(db *gorm.DB, userID string, intervalDays int, activeCol, flagCol, label, phone string) {
	var tasks []models.Task
	query := fmt.Sprintf("user_id = ? AND done = FALSE AND %s = TRUE AND %s = FALSE AND due_date = CURDATE() + INTERVAL ? DAY", activeCol, flagCol)
	db.Where(query, userID, intervalDays).Find(&tasks)

	for _, task := range tasks {
		msg := fmt.Sprintf("🔔 *PENGINGAT TUGAS (%s)*\n\n*Judul:* %s\n*Batas Waktu:* %s\n*Link:* %s",
			label, task.Title, task.DueDate, task.URL)

		if SendWhatsApp(phone, msg) {
			db.Model(&task).Update(flagCol, true)
		}
	}
}

func checkUserBills(db *gorm.DB, userID string, intervalDays int, activeCol, label, phone string) {
	targetDay := time.Now().AddDate(0, 0, intervalDays).Day()
	var bills []models.Bill
	query := fmt.Sprintf("user_id = ? AND %s = TRUE AND day = ?", activeCol)
	db.Where(query, userID, targetDay).Find(&bills)

	for _, bill := range bills {
		msg := fmt.Sprintf("💳 *PENGINGAT TAGIHAN (%s)*\n\n*Nama Tagihan:* %s\n*Nominal:* Rp %d\n*Tanggal Jatuh Tempo:* Tanggal %d",
			label, bill.Name, bill.Amount, bill.Day)

		SendWhatsApp(phone, msg)
	}
}
