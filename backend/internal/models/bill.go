package models

import "time"

type Bill struct {
	ID        string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	Amount    int64     `gorm:"not null" json:"amount"`
	Day       int       `gorm:"not null" json:"day"`
	RemindH3  bool      `gorm:"default:false" json:"remindH3"`
	RemindH1  bool      `gorm:"default:false" json:"remindH1"`
	CreatedAt time.Time `json:"-"`
}
