# TaskFlow — Task & Personal Finance Management System

TaskFlow adalah aplikasi manajemen tugas (*task management*) dan pelacak keuangan pribadi (*personal finance tracker*) berbasis web. Aplikasi ini dilengkapi dengan integrasi pengingat otomatis ke WhatsApp menggunakan Cron Scheduler untuk mengingatkan batas waktu tugas (*deadline*) serta tanggal jatuh tempo tagihan rutin bulanan (*recurring bills*).

---

## 🛠 Tech Stack

### Backend
- **Bahasa Pemrograman:** Go (Golang)
- **Web Framework:** [Go Fiber v2](https://gofiber.io/)
- **ORM:** [GORM](https://gorm.io/)
- **Database Driver:** MySQL Driver for GORM
- **Cron Scheduler:** [`robfig/cron/v3`](https://github.com/robfig/cron)
- **ID Generator:** Google UUID v4

### Frontend
- **Framework:** Vue 3 (Vite + TypeScript)
- **Styling:** Tailwind CSS
- **HTTP Client / State:** Fetch / TanStack Query / Axios

### Infrastruktur & Deployment
- **Database:** MySQL 8.x / MariaDB (`taskflow_db`)
- **Containerization:** Docker & Docker Compose

---

## 🏗 Struktur Proyek

```text
project1/
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go                 # Entrypoint server Fiber & route definitions
│   ├── config/
│   │   └── database.go             # Koneksi GORM & migrasi schema MySQL
│   ├── internal/
│   │   ├── handlers/
│   │   │   ├── bill_handler.go         # CRUD & dynamic update tagihan
│   │   │   ├── setting_handler.go      # Pengaturan nomor WhatsApp
│   │   │   ├── task_handler.go         # CRUD & dynamic update tugas
│   │   │   └── transaction_handler.go  # Transaksi & kalkulasi finance summary
│   │   ├── models/
│   │   │   ├── bill.go                 # Model tagihan rutin
│   │   │   ├── setting.go              # Model konfigurasi sistem
│   │   │   ├── task.go                 # Model tugas
│   │   │   └── transaction.go          # Model transaksi keuangan
│   │   └── services/
│   │       ├── scheduler.go            # Cron job pengingat H-3 & H-1
│   │       └── whatsapp.go             # Gateway integrasi WhatsApp
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/                 # Komponen antarmuka pengguna
│   │   ├── lib/
│   │   │   └── adapters.ts             # Transformasi DTO API & normalisasi data
│   │   └── queries/
│   │       └── index.ts                # API client & state management
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── verify-api.mjs                      # Script automated verification kontrak API
└── README.md
```

---

## 🗄 Skema Database (`taskflow_db`)

### 1. Tabel `tasks`
Menyimpan tugas, tanggal jatuh tempo, dan preferensi pengingat.
```sql
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
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
    updated_at TIMESTAMP NULL
);
```

### 2. Tabel `transactions`
Menyimpan catatan riwayat pemasukan dan pengeluaran keuangan.
```sql
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(20) NOT NULL,            -- 'income' atau 'expense'
    description VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL,
    category VARCHAR(100),
    method VARCHAR(100),
    date VARCHAR(50) NOT NULL             -- Format ISO 8601 (misal: 2026-10-26T18:30:00+07:00)
);
```

### 3. Tabel `bills`
Menyimpan daftar tagihan rutin bulanan.
```sql
CREATE TABLE bills (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL,
    day INT NOT NULL,                     -- Tanggal jatuh tempo (1 - 31)
    remind_h3 BOOLEAN DEFAULT FALSE,
    remind_h1 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL
);
```

### 4. Tabel `settings`
Menyimpan variabel konfigurasi dinamis aplikasi (misal nomor WhatsApp tujuan).
```sql
CREATE TABLE settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL
);
```

---

## 🔌 Dokumentasi REST API

Base URL Backend: `http://localhost:8088/api`

### 1. Pengaturan WhatsApp (`/api/settings/wa`)
* **`GET /api/settings/wa`**  
  *Response (200 OK):*
  ```json
  { "waNumber": "6281234567890" }
  ```
* **`PUT /api/settings/wa`**  
  *Request:*
  ```json
  { "waNumber": "081234567890" }
  ```
  *Note:* Backend otomatis menormalisasi nomor berawalan `0` atau `+62` menjadi format `628...`.

---

### 2. Tugas (`/api/tasks`)
* **`GET /api/tasks`**  
  Mengambil semua daftar tugas, diurutkan berdasarkan `due_date ASC`.
* **`POST /api/tasks`**  
  *Request:*
  ```json
  {
    "title": "Tugas Grafika Komputer",
    "description": "Simulasi 3D Cube",
    "category": "Kuliah",
    "url": "https://classroom.google.com",
    "dueDate": "2026-10-30",
    "remindH3": true,
    "remindH1": false,
    "done": false
  }
  ```
* **`PATCH /api/tasks/:id`**  
  Mendukung pembaruan dinamis parsial (misal toggle status selesai `{ "done": true }`) maupun pembaruan atribut penuh (`title`, `description`, `category`, `dueDate`, `remindH3`, `remindH1`).  
  *Response:* `204 No Content`
* **`DELETE /api/tasks/:id`**  
  Menghapus tugas berdasarkan ID.  
  *Response:* `204 No Content`

---

### 3. Transaksi Keuangan (`/api/transactions`)
* **`GET /api/transactions`**  
  Mendukung query parameter:
  * `?month=YYYY-MM` (Filter bulan tertentu, misal: `?month=2026-10`)
  * `?category=NamaKategori`
  * `?q=kata_kunci` (Pencarian teks pada deskripsi)
* **`POST /api/transactions`**  
  *Request:*
  ```json
  {
    "type": "income",
    "description": "Gaji Pokok Oktober",
    "amount": 5000000,
    "category": "Gaji",
    "method": "Transfer Bank",
    "date": "2026-10-26T18:30:00+07:00"
  }
  ```
* **`PATCH /api/transactions/:id`**  
  Pembaruan sebagian atau seluruh atribut transaksi.  
  *Response:* `204 No Content`
* **`DELETE /api/transactions/:id`**  
  *Response:* `204 No Content`

---

### 4. Tagihan Bulanan (`/api/bills`)
* **`GET /api/bills`**  
  Mengambil daftar tagihan rutin bulanan.
* **`POST /api/bills`**  
  *Request:*
  ```json
  {
    "name": "Internet & WiFi",
    "amount": 350000,
    "day": 5,
    "remindH3": true,
    "remindH1": true
  }
  ```
* **`PATCH /api/bills/:id`**  
  *Response:* `204 No Content`
* **`DELETE /api/bills/:id`**  
  *Response:* `204 No Content`

---

### 5. Ringkasan Keuangan (`/api/finance/summary`)
* **`GET /api/finance/summary?month=YYYY-MM`**  
  Menghitung akumulasi transaksi per bulan.  
  *Response (200 OK):*
  ```json
  {
    "balance": 4650000,
    "totalIncome": 5000000,
    "totalExpense": 350000
  }
  ```

---

## ⏰ Cron Scheduler & Notifikasi WhatsApp

Scheduler dijalankan menggunakan library `robfig/cron/v3` di latar belakang server backend:

1. **Jadwal Eksekusi:** Berjalan setiap hari pada pukul **08:00 pagi** (`0 8 * * *`).
2. **Aturan Notifikasi Tugas:**
   * **H-3:** Jika `remind_h3 = true`, `done = false`, `notified_h3 = false`, dan tanggal hari ini = `due_date - 3 hari`.
   * **H-1:** Jika `remind_h1 = true`, `done = false`, `notified_h1 = false`, dan tanggal hari ini = `due_date - 1 hari`.
   * Flag `notified_h3` / `notified_h1` akan diubah menjadi `true` setelah pesan sukses dikirim guna menghindari pesan terkirim berulang.
3. **Aturan Notifikasi Tagihan:**
   * Mengecek apakah target tanggal pengingat (hari ini + 3 hari untuk H-3, atau hari ini + 1 hari untuk H-1) sesuai dengan kolom `day` tagihan yang opsi pengingatnya aktif.

---

## 🚀 Panduan Menjalankan Aplikasi

### Opsi 1: Menjalankan Secara Manual (Development Mode)

#### 1. Persiapkan Database
Pastikan database MySQL aktif dan buat database baru:
```sql
CREATE DATABASE taskflow_db;
```

#### 2. Jalankan Backend
Masuk ke direktori `backend/` dan mulai server:
```bash
cd backend
go mod tidy
go run cmd/api/main.go
```
*Server akan berjalan di port `http://localhost:8088`.*

#### 3. Jalankan Frontend
Buka tab terminal baru:
```bash
cd frontend
npm install
npm run dev
```
*Frontend akan aktif di `http://localhost:5173`.*

---

### Opsi 2: Menggunakan Docker Compose

Jalankan seluruh ekosistem (MySQL, Backend, dan Frontend) dalam satu perintah dari root direktori:
```bash
docker compose up -d --build
```

---

## 🧪 Pengujian Otomatis Kontrak API

Aplikasi dilengkapi skrip validasi menyeluruh `verify-api.mjs` untuk menguji keselarasan DTO, payload, dynamic update, dan sanitasi data:

```bash
# Pengujian langsung ke backend port 8088
node verify-api.mjs

# Pengujian melalui proxy dev server Vite
node verify-api.mjs http://localhost:5173/api
```