# TaskFlow — Task & Personal Finance Management System

TaskFlow adalah aplikasi web manajemen tugas (*task management*) dan pelacak keuangan pribadi (*personal finance tracker*) multi-tenant. Aplikasi ini dilengkapi dengan sistem autentikasi JWT terisolasi, kategori tugas kustom dengan penyesuaian aksen (*tone*), serta integrasi pengingat otomatis ke WhatsApp menggunakan Cron Scheduler untuk mengingatkan batas waktu tugas (*deadline*) dan tanggal jatuh tempo tagihan rutin bulanan (*recurring bills*).

---

## 🛠 Tech Stack

### Backend
* **Bahasa Pemrograman:** Go (Golang)
* **Web Framework:** [Go Fiber v2](https://gofiber.io/)
* **ORM:** [GORM](https://gorm.io/)
* **Database Driver:** MySQL Driver for GORM
* **Autentikasi & Keamanan:** `golang-jwt/jwt/v5` (HMAC-SHA256) & `golang.org/x/crypto/bcrypt`
* **Cron Scheduler:** [`robfig/cron/v3`](https://github.com/robfig/cron)
* **ID Generator:** Google UUID v4

### Frontend
* **Framework:** Vue 3 (Vite + TypeScript)
* **Styling:** Tailwind CSS
* **HTTP Client & State:** Fetch / TanStack Query / Axios via Vite Proxy

### Infrastruktur & Deployment
* **Database:** MySQL 8.x / MariaDB (`taskflow_db`)
* **Containerization:** Docker & Docker Compose

---

## 🏗 Struktur Proyek

```
project1/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go                 # Entrypoint server Fiber & rute publik/terproteksi
│   ├── config/
│   │   └── database.go             # Koneksi GORM MySQL
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── auth_handler.go         # Register, Login, Me, Logout, Delete Account
│   │   │   ├── bill_handler.go         # CRUD & dynamic update tagihan per user
│   │   │   ├── setting_handler.go      # Pengaturan nomor WhatsApp per user
│   │   │   ├── task_category_handler.go# CRUD kategori tugas kustom (tone, limit 20)
│   │   │   ├── task_handler.go         # CRUD & validasi kategori tugas per user
│   │   │   └── transaction_handler.go  # Transaksi keuangan & summary bulanan
│   │   ├── middleware/
│   │   │   └── auth.go                 # JWT Bearer verification & extraction user_id
│   │   ├── models/
│   │   │   ├── bill.go                 # Model tagihan rutin
│   │   │   ├── setting.go              # Model konfigurasi WhatsApp user (user_settings)
│   │   │   ├── task.go                 # Model tugas
│   │   │   ├── task_category.go        # Model kategori tugas (name, tone)
│   │   │   ├── transaction.go          # Model transaksi keuangan
│   │   │   └── user.go                 # Model user & kredensial bcrypt
│   │   └── services/
│   │       ├── scheduler.go            # Cron job pengingat H-3 & H-1 per user
│   │       └── whatsapp.go             # Gateway integrasi WhatsApp
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/                            # Antarmuka Vue 3 & state management
│   ├── .env                            # Variabel lingkungan frontend (VITE_API_URL, dll.)
│   ├── package.json
│   └── vite.config.ts                  # Konfigurasi port 5173 & reverse proxy /api
├── docker-compose.yml
├── verify-api.mjs                      # Script automated verification kontrak API backend/proxy
└── README.md
```

---

## 🗄 Skema Database (`taskflow_db`)

Seluruh data entitas dipisahkan berdasarkan `user_id` dengan relasi integritas referensial `ON DELETE CASCADE`.

```sql
-- 1. Pengguna
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pengaturan WhatsApp Pengguna
CREATE TABLE user_settings (
  user_id CHAR(36) PRIMARY KEY,
  wa_number VARCHAR(50) DEFAULT '',
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Kategori Tugas Kustom
CREATE TABLE task_categories (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(24) NOT NULL,
  tone VARCHAR(10) NOT NULL DEFAULT 'neutral',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_tone CHECK (tone IN ('primary', 'secondary', 'tertiary', 'neutral'))
);
CREATE UNIQUE INDEX task_categories_user_name_uq ON task_categories (user_id, name);
CREATE INDEX task_categories_user_idx ON task_categories (user_id);

-- 4. Tugas
CREATE TABLE tasks (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  url TEXT,
  due_date DATE NOT NULL,
  remind_h3 BOOLEAN DEFAULT FALSE,
  remind_h1 BOOLEAN DEFAULT FALSE,
  done BOOLEAN DEFAULT FALSE,
  notified_h3 BOOLEAN DEFAULT FALSE,
  notified_h1 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Transaksi Keuangan
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL,            -- 'income' atau 'expense'
  description VARCHAR(255) NOT NULL,
  amount BIGINT NOT NULL,
  category VARCHAR(100),
  method VARCHAR(100),
  date VARCHAR(50) NOT NULL,            -- Format ISO 8601
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Tagihan Rutin Bulanan
CREATE TABLE bills (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount BIGINT NOT NULL,
  day INT NOT NULL,                     -- Tanggal jatuh tempo (1 - 31)
  remind_h3 BOOLEAN DEFAULT FALSE,
  remind_h1 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NULL,
  CONSTRAINT fk_bills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔌 Dokumentasi REST API

Semua respons kesalahan menggunakan format standar:
```json
{
  "error": "Pesan kesalahan deskriptif"
}
```

Endpoint terproteksi mewajibkan header:
`Authorization: Bearer <token_jwt>`

### 1. Autentikasi (`/api/auth`)

| Method | Endpoint | Akses | Deskripsi | Status Berhasil |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Publik | Mendaftarkan akun, hash bcrypt, auto-seed 5 kategori bawaan | `201 Created` |
| `POST` | `/api/auth/login` | Publik | Otentikasi kredensial & penerbitan token JWT | `200 OK` |
| `GET` | `/api/auth/me` | Bearer | Mengambil profil user yang sedang login (`id`, `name`, `email`) | `200 OK` |
| `POST` | `/api/auth/logout` | Bearer | Menghapus status sesi | `204 No Content` |
| `DELETE`| `/api/auth/me` | Bearer | Hapus akun beserta seluruh data terkait (wajib menyertakan `{ "password": "..." }`) | `204 No Content` |

### 2. Kategori Tugas (`/api/task-categories`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/task-categories` | Bearer | Mengambil seluruh kategori kustom milik pengguna (`created_at ASC, id ASC`). |
| `POST` | `/api/task-categories` | Bearer | Membuat kategori baru (nama 2-24 char, tone: `primary`/`secondary`/`tertiary`/`neutral`, limit 20). |
| `DELETE`| `/api/task-categories/:id`| Bearer | Menghapus kategori (ditolak `409` bila masih digunakan oleh tugas). |

Format DTO Kategori:
```json
{
  "id": "c1f7a0b2-8419-4b62-98b3-1f1489ecb341",
  "name": "Kuliah",
  "tone": "tertiary"
}
```

### 3. Tugas (`/api/tasks`)

* **`GET /api/tasks`**: Mengambil daftar tugas milik user (`due_date ASC`).
* **`POST /api/tasks`**: Membuat tugas baru. Field `category` divalidasi terhadap `task_categories` milik pengguna dan dinormalisasi ke bentuk kanoniknya.
* **`PATCH /api/tasks/:id`**: Pembaruan dinamis parsial (misal toggle status selesai `{ "done": true }`) maupun pembaruan atribut penuh (`title`, `description`, `category`, `dueDate`, `remindH3`, `remindH1`). Mengembalikan `404` jika ID bukan milik user.
* **`DELETE /api/tasks/:id`**: Menghapus tugas milik user (`204 No Content`).

### 4. Transaksi Keuangan (`/api/transactions`) & Summary

* **`GET /api/transactions`**: Mendukung query filter per pengguna:
  * `?month=YYYY-MM`
  * `?category=NamaKategori`
  * `?q=kata_kunci` (Pencarian pada deskripsi)
* **`POST /api/transactions`**: Mencatat transaksi pemasukan (`income`) atau pengeluaran (`expense`).
* **`PATCH /api/transactions/:id`**: Pembaruan data transaksi milik user.
* **`DELETE /api/transactions/:id`**: Menghapus transaksi.
* **`GET /api/finance/summary?month=YYYY-MM`**: Kalkulasi ringkasan saldo, pemasukan, dan pengeluaran user pada bulan tertentu.
  ```json
  {
    "balance": 4650000,
    "totalIncome": 5000000,
    "totalExpense": 350000
  }
  ```

### 5. Tagihan Rutin (`/api/bills`)

* **`GET /api/bills`**: Mengambil daftar tagihan rutin bulanan milik user.
* **`POST /api/bills`**: Mendaftarkan tagihan baru (`name`, `amount`, `day` [1-31], `remindH3`, `remindH1`).
* **`PATCH /api/bills/:id`**: Mengubah nominal, tanggal jatuh tempo, atau status pengingat.
* **`DELETE /api/bills/:id`**: Menghapus tagihan.

### 6. Pengaturan WhatsApp (`/api/settings/wa`)

* **`GET /api/settings/wa`**: Mengambil nomor WhatsApp terdaftar milik pengguna.
* **`PUT /api/settings/wa`**: Menyimpan nomor WhatsApp dengan normalisasi otomatis format internasional Indonesia (awalan `0` dan `+62` diubah menjadi `628...`).

---

## ⏰ Cron Scheduler & Notifikasi WhatsApp

Scheduler berjalan otomatis setiap hari pada pukul **08:00 pagi** (`0 8 * * *`):
1. Mengambil seluruh user yang memiliki nomor WhatsApp terdaftar di tabel `user_settings`.
2. Mengecek tugas belum selesai (`done = false`) yang jatuh tempo dalam H-3 dan H-1, lalu mengirimkan pengingat WhatsApp ke masing-masing pengguna.
3. Menandai flag `notified_h3` / `notified_h1` menjadi `true` setelah terkirim agar tidak terjadi duplikasi pesan.
4. Mengecek tagihan bulanan yang tanggal jatuh temponya cocok dengan interval H-3 atau H-1 dari tanggal eksekusi.

---

## 🚀 Panduan Menjalankan Aplikasi

### Konfigurasi Environment (`frontend/.env`)
Pastikan file `frontend/.env` telah terkonfigurasi dengan benar:
```env
VITE_USE_MOCK=false
VITE_API_URL=/api
```
*(Dev server Vite diatur mem-proxy `/api` ke backend Go di `http://127.0.0.1:8088`)*.

### 1. Jalankan Backend (Go)
```bash
cd backend
go mod tidy
go run cmd/api/main.go
```
*Backend mendengarkan di `http://127.0.0.1:8088`.*

### 2. Jalankan Frontend (Vue 3 + Vite)
Buka tab terminal baru:
```bash
cd frontend
npm install
npm run dev
```
*Aplikasi web dapat diakses melalui peramban di `http://localhost:5173`.*

---

## 🧪 Verifikasi & Pengujian Kontrak API

Jalankan skrip uji otomatis untuk memverifikasi isolasi multi-tenant, autentikasi JWT, relasi cascade, format nomor WhatsApp, dan keutuhan kontrak API:

```bash
# Pengujian langsung ke Backend
node verify-api.mjs http://localhost:8088/api

# Pengujian melalui Vite Dev Server Proxy
node verify-api.mjs http://localhost:5173/api
```