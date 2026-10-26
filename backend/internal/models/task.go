package models

import "time"

type Task struct {
	ID          string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Category    string    `gorm:"type:varchar(100)" json:"category"`
	URL         string    `gorm:"type:text" json:"url"`
	DueDate     string    `gorm:"type:date;not null" json:"dueDate"` // Format YYYY-MM-DD
	RemindH3    bool      `gorm:"default:false" json:"remindH3"`
	RemindH1    bool      `gorm:"default:false" json:"remindH1"`
	Done        bool      `gorm:"default:false" json:"done"`
	NotifiedH3  bool      `gorm:"default:false" json:"-"`
	NotifiedH1  bool      `gorm:"default:false" json:"-"`
	CreatedAt   time.Time `json:"-"`
	UpdatedAt   time.Time `json:"-"`
	UserID      string    `gorm:"type:char(36);index" json:"-"`
}
