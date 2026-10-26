package models

type Setting struct {
	Key   string `gorm:"primaryKey;column:setting_key;type:varchar(50)" json:"-"`
	Value string `gorm:"type:text;not null" json:"-"`
}

type WaSettingResponse struct {
	WaNumber string `json:"waNumber"`
}
