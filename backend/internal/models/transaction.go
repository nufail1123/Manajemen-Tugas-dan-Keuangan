package models

import "time"

type Transaction struct {
	ID          string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Type        string    `gorm:"type:enum('income','expense');not null" json:"type"`
	Description string    `gorm:"type:varchar(255)" json:"description"`
	Amount      int64     `gorm:"not null" json:"amount"`
	Category    string    `gorm:"type:varchar(100)" json:"category"`
	Method      string    `gorm:"type:varchar(50)" json:"method"`
	Date        string    `gorm:"type:varchar(30);not null" json:"date"` // ISO String
	CreatedAt   time.Time `json:"-"`
}
