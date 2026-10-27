# TaskFlow Web (Vue 3 + Tailwind)

```bash
npm install
npm run dev      # http://localhost:5173 (API palsu / localStorage)
npm run build    # type-check + build produksi
```

Hubungkan ke backend Go: `VITE_USE_MOCK=false` di `.env`. Request `/api/*` diteruskan ke `http://localhost:8080` (lihat `vite.config.ts`; route di Go harus berawalan `/api`).

## Autentikasi

Halaman `/masuk` dan `/daftar` memakai endpoint di bawah. Token JWT disimpan di localStorage dan dikirim sebagai
`Authorization: Bearer <token>` pada setiap request. Respons 401 di luar login/daftar membuat aplikasi keluar otomatis.

| Method | Path | Auth | Body | Berhasil | Gagal |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | publik | `{name, email, password}` | `201` `{token, user:{id,name,email}}` | `400` data tidak valid, `409` email sudah ada |
| POST | `/api/auth/login` | publik | `{email, password}` | `200` `{token, user}` | `401` email/kata sandi salah |
| GET | `/api/auth/me` | Bearer | - | `200` `{id,name,email}` | `401` |
| POST | `/api/auth/logout` | Bearer | - | `204` | - |
| DELETE | `/api/auth/me` | Bearer | `{password}` | `204` | `403` kata sandi salah, `401` token tidak valid |

Semua endpoint data (`/tasks`, `/transactions`, `/bills`, `/finance/summary`, `/settings/wa`) wajib login dan hanya
mengembalikan/mengubah data milik pemilik token.

Uji otomatis (membuat akun uji, memeriksa semuanya, lalu menghapusnya): `node tools/verify-api.mjs`

## Kontrak API

| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/tasks` | array JSON |
| POST | `/api/tasks` | buat tugas |
| PATCH | `/api/tasks/:id` | ubah sebagian field (centang `done`, atau edit penuh) |
| DELETE | `/api/tasks/:id` | hapus |
| GET | `/api/transactions?month=2026-10&category=Makanan&q=kost` | semua param opsional; urut tanggal terbaru |
| POST / PATCH / DELETE | `/api/transactions[/:id]` | catat / ubah / hapus |
| GET | `/api/finance/summary?month=2026-10` | ringkasan bulan (lihat bawah) |
| GET / POST | `/api/bills` | daftar / buat tagihan |
| PATCH / DELETE | `/api/bills/:id` | ubah / hapus |
| GET / PUT | `/api/settings/wa` | `{"waNumber":"628..."}` |
| GET / POST | `/api/task-categories` | daftar / buat kategori tugas `{name, tone}` (lihat `BACKEND.md`) |
| DELETE | `/api/task-categories/:id` | hapus; `409` bila masih dipakai tugas |

`category` tidak dikirim bila filter "Semua".

### Bentuk JSON

```jsonc
// Task
{ "id":"1","title":"..","description":"..","category":"DevOps","url":"https://..","dueDate":"2026-10-30",
  "remindH3":true,"remindH1":true,"done":false }
// Transaction (amount = angka murni, date = ISO datetime)
{ "id":"1","type":"expense","description":"..","amount":1500000,"category":"Tagihan","method":"QRIS","date":"2026-10-26T14:30:00" }
// TaskCategory (tone: primary | secondary | tertiary | neutral)
{ "id":"7","name":"Kuliah","tone":"tertiary" }
// Bill
{ "id":"1","name":"..","amount":350000,"day":5,"remindH3":true,"remindH1":false }
// GET /finance/summary
{ "month":"2026-10","income":12500000,"expense":3200000,"balance":9300000,
  "incomeCount":1,"expenseCount":5,"billTotal":2030000,"billCount":3,
  "byCategory":[{"category":"Tagihan","amount":1950000}],   // pengeluaran per kategori, terbesar dulu
  "daily":[{"day":4,"expense":1500000}] }                    // pengeluaran per tanggal
```

Flag internal seperti `notified_h3` / `notified_h1` (apakah pesan sudah terkirim) cukup disimpan di database backend dan **tidak perlu** dikirim ke frontend. Frontend hanya mengirim `remindH3` dan `remindH1`.

## Tema (neo-brutalist: persik, ungu, kuning, pink)

Warna & bayangan didefinisikan di `tailwind.config.js` (token `ink`, `accent`, `primary`, bayangan `shadow-hard*`).
Animasi (`rise`, `pop`, `marquee`, `blink`, `grow-x`, `reveal-x`, `float`) ada di config yang sama; utilitas `.stagger`
(muncul bergantian) ada di `src/style.css`. Semua animasi otomatis mati bila OS memakai "reduce motion".
Font judul: Archivo (`npm install` sekali lagi karena ada dependensi baru `@fontsource-variable/archivo`).
