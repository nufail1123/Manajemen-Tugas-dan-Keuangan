package models

import "time"

type TaskCategory struct {
	ID        string    `gorm:"primaryKey;type:char(36)" json:"id"`
	UserID    string    `gorm:"type:char(36);not null" json:"-"`
	Name      string    `gorm:"type:varchar(24);not null" json:"name"`
	Tone      string    `gorm:"type:varchar(10);default:'neutral'" json:"tone"`
	CreatedAt time.Time `json:"-"`
}
