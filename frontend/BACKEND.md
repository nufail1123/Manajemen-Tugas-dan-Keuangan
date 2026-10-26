# Instruksi Backend: Kategori Tugas Kustom

Frontend sudah selesai dan memakai endpoint baru `/api/task-categories`. Dokumen ini berisi semua yang harus
ditambah/diubah di backend Go. Contoh SQL memakai sintaks PostgreSQL; sesuaikan bila memakai database lain.

Ringkasan perubahan:

| # | Perubahan | Jenis |
|---|---|---|
| 1 | Tabel `task_categories` | baru |
| 2 | Endpoint `GET/POST/DELETE /api/task-categories` | baru |
| 3 | Validasi `category` pada `POST/PATCH /api/tasks` | ubah |
| 4 | Seed kategori bawaan saat registrasi | ubah |
| 5 | Migrasi data untuk pengguna yang sudah ada | baru (sekali jalan) |
| 6 | Hapus kategori saat akun dihapus (`DELETE /api/auth/me`) | ubah |
| 7 | Uji otomatis + README | ubah |

Tidak ada perubahan pada: `GET /api/tasks` (field `category` tetap berupa **nama** kategori, string), cron WhatsApp,
`/finance/*`, `/bills`, `/settings/wa`. Filter kategori di halaman Tugas dilakukan di browser.

---

## 1. Tabel `task_categories`

```sql
CREATE TABLE task_categories (
  id         BIGSERIAL PRIMARY KEY,                       -- atau UUID, sesuaikan dengan tabel lain
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(24) NOT NULL,
  tone       VARCHAR(10) NOT NULL DEFAULT 'neutral'
             CHECK (tone IN ('primary','secondary','tertiary','neutral')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Nama unik per pengguna, tanpa membedakan huruf besar/kecil ("Kuliah" == "kuliah")
CREATE UNIQUE INDEX task_categories_user_name_uq ON task_categories (user_id, lower(name));
CREATE INDEX task_categories_user_idx ON task_categories (user_id);
```

Kolom `tasks.category` **tetap string** (nama kategori). Tidak perlu foreign key dan tidak perlu mengubah tabel `tasks`.

```go
type TaskCategory struct {
    ID   string `json:"id"`   // kirim sebagai string, sama seperti id task/bill
    Name string `json:"name"`
    Tone string `json:"tone"` // primary | secondary | tertiary | neutral
}
```

## 2. Endpoint baru (semua wajib Bearer token, hanya data milik pemilik token)

| Method | Path | Body | Berhasil | Gagal |
|---|---|---|---|---|
| GET | `/api/task-categories` | - | `200` array `[{id,name,tone}]`, urut `created_at ASC, id ASC` | `401` |
| POST | `/api/task-categories` | `{name, tone}` | `201` `{id,name,tone}` | `400`, `409`, `401` |
| DELETE | `/api/task-categories/:id` | - | `204` | `404`, `409`, `401` |

Semua error memakai bentuk `{"error": "pesan bahasa Indonesia"}`. Frontend menampilkan pesan ini langsung
sebagai toast untuk status 400/409/422, jadi tulis kalimat yang ramah pengguna.

### POST: aturan validasi (urutan pemeriksaan)

1. Body bukan JSON valid atau field kosong -> `400` `"Data tidak lengkap"`.
2. `name`: `strings.TrimSpace`, lalu ratakan spasi ganda menjadi satu (`strings.Join(strings.Fields(name), " ")`).
   Panjang diukur dalam **karakter** (`utf8.RuneCountInString`), bukan byte: minimal 2, maksimal 24 -> `400` `"Nama kategori 2-24 karakter"`.
3. `strings.EqualFold(name, "semua")` -> `400` `"Nama \"Semua\" tidak boleh dipakai"` (kata ini dipakai frontend untuk filter "semua kategori").
4. `tone` harus salah satu dari `primary|secondary|tertiary|neutral`. Bila kosong, pakai `neutral`; bila tidak dikenal -> `400` `"Warna tidak valid"`.
5. Jumlah kategori milik user sudah 20 -> `409` `"Maksimal 20 kategori"`. Hitung dan insert dalam satu transaksi.
6. Nama sudah ada (case-insensitive): tangkap pelanggaran unique index (Postgres kode `23505`) -> `409` `"Kategori sudah ada"`.
   Jangan cek-lalu-insert saja; unique index adalah pengaman utama agar aman dari race condition.

Simpan `name` apa adanya (huruf besar/kecil sesuai input) setelah dirapikan.

### DELETE: aturan

1. Cari kategori `WHERE id = $1 AND user_id = $2`. Tidak ada (atau milik user lain) -> `404`.
   Jangan bedakan "milik user lain" dengan "tidak ada" agar tidak membocorkan id.
2. Hitung pemakaian: `SELECT count(*) FROM tasks WHERE user_id = $2 AND lower(category) = lower($name)`.
   Bila > 0 -> `409` `"Kategori masih dipakai N tugas"`. Tugas yang sudah selesai (`done = true`) tetap dihitung.
3. Jika 0 -> hapus, balas `204` tanpa body. Lakukan langkah 2 dan 3 dalam satu transaksi.

Tidak ada endpoint PATCH/ubah nama pada versi ini (mengubah nama harus ikut memperbarui `tasks.category`; bisa ditambah nanti).

## 3. Ubah `POST /api/tasks` dan `PATCH /api/tasks/:id`

- Bila body **memuat** field `category`, nilainya wajib ada di `task_categories` milik user tersebut
  (cocokkan `lower(name) = lower($1)`), kalau tidak -> `400` `"Kategori tidak ditemukan"`.
- Simpan nama dalam bentuk kanonik dari tabel kategori (bukan huruf yang diketik klien).
- Pada `PATCH` yang **tidak** memuat `category` (mis. hanya `{"done": true}` saat mencentang tugas), lewati validasi ini.
- `GET /api/tasks` tidak berubah.

## 4. Seed kategori bawaan saat registrasi

Di handler `POST /api/auth/register`, dalam transaksi yang sama dengan pembuatan user, isi 5 kategori bawaan
(urutan tampil mengikuti urutan insert):

| name | tone |
|---|---|
| Q4 Roadmap | primary |
| DevOps | secondary |
| Personal | neutral |
| Frontend | primary |
| Strategy | tertiary |

```go
var defaultCategories = []struct{ Name, Tone string }{
    {"Q4 Roadmap", "primary"}, {"DevOps", "secondary"}, {"Personal", "neutral"},
    {"Frontend", "primary"}, {"Strategy", "tertiary"},
}
```

Bila registrasi sudah menyiapkan data awal lain (mis. nomor WA), tambahkan seed ini di tempat yang sama.

## 5. Migrasi untuk pengguna yang sudah ada (jalankan sekali, idempoten)

Tanpa langkah ini pengguna lama tidak punya kategori dan tidak bisa mengedit tugas lamanya (validasi di poin 3 akan menolak).

```sql
-- a) kategori bawaan untuk semua user
INSERT INTO task_categories (user_id, name, tone)
SELECT u.id, d.name, d.tone
FROM users u
CROSS JOIN (VALUES ('Q4 Roadmap','primary'),('DevOps','secondary'),('Personal','neutral'),
                   ('Frontend','primary'),('Strategy','tertiary')) AS d(name, tone)
ON CONFLICT (user_id, lower(name)) DO NOTHING;

-- b) kategori yang sudah terlanjur dipakai tugas tetapi bukan bawaan
INSERT INTO task_categories (user_id, name, tone)
SELECT DISTINCT ON (t.user_id, lower(t.category)) t.user_id, left(trim(t.category), 24), 'neutral'
FROM tasks t
WHERE trim(t.category) <> ''
ON CONFLICT (user_id, lower(name)) DO NOTHING;
```

Catatan: `ON CONFLICT` pada indeks ekspresi perlu ditulis `ON CONFLICT (user_id, lower(name))` persis seperti definisi indeks.
Bila ada nama kategori lama yang lebih dari 24 karakter, `left(..., 24)` akan memotongnya; cek dulu dengan
`SELECT DISTINCT category FROM tasks WHERE char_length(category) > 24` dan rapikan manual agar nama di `tasks` tetap cocok.

## 6. Hapus akun

`DELETE /api/auth/me` harus ikut menghapus kategori user. Dengan `ON DELETE CASCADE` di tabel di atas ini otomatis;
bila tidak memakai FK, tambahkan `DELETE FROM task_categories WHERE user_id = $1` dalam transaksi penghapusan akun.

## 7. Uji dan dokumentasi

Tambahkan ke `tools/verify-api.mjs` (atau uji Go) skenario berikut, memakai akun uji:

- `GET /task-categories` pada akun baru -> 5 kategori bawaan.
- `POST {name:"Kuliah", tone:"tertiary"}` -> `201`; ulangi dengan `"kuliah"` -> `409`.
- `POST {name:"a"}` -> `400`; `POST {name:"Semua"}` -> `400`; `POST {name:"X", tone:"merah"}` -> `400`.
- Buat sampai 20 kategori, yang ke-21 -> `409`.
- `POST /tasks` dengan `category:"Kuliah"` -> `201`; dengan `category:"Tidak Ada"` -> `400`.
- `PATCH /tasks/:id {"done":true}` tanpa `category` -> tetap `204`.
- `DELETE /task-categories/:id` saat dipakai tugas -> `409`; setelah tugas dipindah/dihapus -> `204`.
- Akun B tidak bisa melihat atau menghapus kategori akun A (`404`).
- Tanpa token -> `401`.

Perbarui tabel "Kontrak API" di `README.md` dengan tiga endpoint baru di atas dan bentuk JSON:

```jsonc
// TaskCategory
{ "id":"7","name":"Kuliah","tone":"tertiary" }
```

## Urutan pengerjaan yang disarankan

1. Migrasi tabel (poin 1) lalu migrasi data (poin 5).
2. Endpoint kategori (poin 2) dan seed registrasi (poin 4).
3. Validasi di `/tasks` (poin 3) **terakhir**, setelah data lama termigrasi.
4. Cascade hapus akun (poin 6), uji (poin 7).

Selama endpoint belum ada, frontend tidak rusak: bila `GET /task-categories` menjawab `404`, frontend memakai 5 kategori
bawaan (hanya baca) dan menggabungkannya dengan kategori yang sudah dipakai tugas; tombol Tambah akan gagal sampai backend siap.
