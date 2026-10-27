package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services"
	"context"
	"log"
	"net/mail"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB *gorm.DB
}

var defaultCategories = []struct {
	Name string
	Tone string
}{
	{"Q4 Roadmap", "primary"},
	{"DevOps", "secondary"},
	{"Personal", "neutral"},
	{"Frontend", "primary"},
	{"Strategy", "tertiary"},
}

func isValidEmail(email string) bool {
	addr, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}
	parts := strings.Split(addr.Address, "@")
	return len(parts) == 2 && strings.Contains(parts[1], ".")
}

// POST /api/auth/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	type RegisterReq struct {
		Name           string `json:"name"`
		Email          string `json:"email"`
		Password       string `json:"password"`
		RecaptchaToken string `json:"recaptchaToken"`
	}

	var req RegisterReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Data tidak lengkap"})
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	// 1. Validasi field wajib
	if req.Name == "" || req.Email == "" || len(req.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nama, email, dan kata sandi (minimal 6 karakter) wajib diisi"})
	}

	if !isValidEmail(req.Email) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Format email tidak valid"})
	}

	// 2. Validasi recaptchaToken
	if strings.TrimSpace(req.RecaptchaToken) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Verifikasi reCAPTCHA gagal, silakan coba lagi."})
	}

	// 3. Verifikasi ke Google dengan timeout context
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	success, err := services.VerifyRecaptcha(ctx, req.RecaptchaToken, c.IP())
	if err != nil {
		log.Printf("[ERROR] Masalah verifikasi reCAPTCHA: %v", err)
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Layanan verifikasi sedang bermasalah, coba beberapa saat lagi.",
		})
	}
	if !success {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Verifikasi reCAPTCHA gagal, silakan coba lagi.",
		})
	}

	// 4. Cek duplikasi email di database
	var exists int64
	h.DB.Model(&models.User{}).Where("email = ?", req.Email).Count(&exists)
	if exists > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah terdaftar"})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal mengenkripsi kata sandi"})
	}

	newUser := models.User{
		ID:           uuid.New().String(),
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	// 5. Simpan user baru dan seed 5 kategori bawaan dalam satu transaksi
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&newUser).Error; err != nil {
			return err
		}

		for _, cat := range defaultCategories {
			categoryItem := models.TaskCategory{
				ID:     uuid.New().String(),
				UserID: newUser.ID,
				Name:   cat.Name,
				Tone:   cat.Tone,
			}
			if err := tx.Create(&categoryItem).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat pengguna"})
	}

	// Buat JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": newUser.ID,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(middleware.GetJWTSecret())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat token"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"token": tokenString,
		"user": models.UserResponse{
			ID:    newUser.ID,
			Name:  newUser.Name,
			Email: newUser.Email,
		},
	})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	type LoginReq struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	var req LoginReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Payload invalid"})
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Email atau kata sandi salah"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Email atau kata sandi salah"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(middleware.GetJWTSecret())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat token"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"token": tokenString,
		"user": models.UserResponse{
			ID:    user.ID,
			Name:  user.Name,
			Email: user.Email,
		},
	})
}

// GET /api/auth/me
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	var user models.User
	if err := h.DB.Select("id, name, email").Where("id = ?", userID).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Pengguna tidak ditemukan"})
	}

	return c.Status(fiber.StatusOK).JSON(models.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

// DELETE /api/auth/me
func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	type DeleteReq struct {
		Password string `json:"password"`
	}
	var req DeleteReq
	if err := c.BodyParser(&req); err != nil || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Kata sandi wajib disertakan"})
	}

	var user models.User
	if err := h.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Pengguna tidak valid"})
	}

	// Verifikasi kata sandi
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Kata sandi salah"})
	}

	// Hapus seluruh entitas milik pengguna dalam satu transaksi database
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&models.TaskCategory{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.UserSetting{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.Task{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.Transaction{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.Bill{}).Error; err != nil {
			return err
		}
		return tx.Delete(&user).Error
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menghapus akun"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
