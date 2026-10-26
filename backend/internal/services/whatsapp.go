package services

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

func SendWhatsApp(targetNumber, message string) bool {
	// Contoh implementasi gateway Fonnte
	apiToken := "MASUKKAN_TOKEN_FONNTE_DI_SINI"
	url := "https://api.fonnte.com/send"

	payload := map[string]string{
		"target":  targetNumber,
		"message": message,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Authorization", apiToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return false
	}
	defer resp.Body.Close()
	return true
}
