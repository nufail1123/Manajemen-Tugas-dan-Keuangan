package models

import "time"

type User struct {
	ID           string    `gorm:"primaryKey;type:char(36)" json:"id"`
	Name         string    `gorm:"type:varchar(100);not null" json:"name"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"` // Tidak pernah diekspos ke JSON
	CreatedAt    time.Time `json:"-"`
}

type UserResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type UserSetting struct {
	UserID   string `gorm:"primaryKey;type:char(36)" json:"userId"`
	WaNumber string `gorm:"type:varchar(50)" json:"waNumber"`
}
