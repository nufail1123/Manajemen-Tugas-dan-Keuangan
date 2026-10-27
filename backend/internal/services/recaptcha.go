package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"slices"
	"strings"
	"time"
)

type siteVerifyResp struct {
	Success    bool     `json:"success"`
	Hostname   string   `json:"hostname"`
	ErrorCodes []string `json:"error-codes"`
}

var captchaClient = &http.Client{Timeout: 5 * time.Second}

func VerifyRecaptcha(ctx context.Context, token, remoteIP string) (bool, error) {
	enabled := os.Getenv("RECAPTCHA_ENABLED") != "false"
	if !enabled {
		return true, nil
	}

	secret := os.Getenv("RECAPTCHA_SECRET")
	if secret == "" {
		return false, fmt.Errorf("RECAPTCHA_SECRET kosong pada lingkungan aktif")
	}

	if token == "" || len(token) > 4096 {
		return false, nil
	}

	form := url.Values{
		"secret":   {secret},
		"response": {token},
	}
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://www.google.com/recaptcha/api/siteverify", strings.NewReader(form.Encode()))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	res, err := captchaClient.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return false, fmt.Errorf("siteverify status %d", res.StatusCode)
	}

	var out siteVerifyResp
	if err := json.NewDecoder(io.LimitReader(res.Body, 1<<16)).Decode(&out); err != nil {
		return false, err
	}

	if !out.Success {
		if slices.Contains(out.ErrorCodes, "invalid-input-secret") || slices.Contains(out.ErrorCodes, "missing-input-secret") {
			return false, fmt.Errorf("recaptcha secret ditolak Google: %v", out.ErrorCodes)
		}
		return false, nil
	}

	// Validasi hostname jika diatur di .env
	rawHostnames := os.Getenv("RECAPTCHA_ALLOWED_HOSTNAMES")
	if rawHostnames != "" {
		allowed := strings.Split(rawHostnames, ",")
		for i := range allowed {
			allowed[i] = strings.TrimSpace(allowed[i])
		}
		if !slices.Contains(allowed, out.Hostname) {
			log.Printf("[SECURITY] Token reCAPTCHA berasal dari hostname tidak sah: %s", out.Hostname)
			return false, nil
		}
	}

	return true, nil
}
