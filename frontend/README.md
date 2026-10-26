# TaskFlow Web (Vue 3 + Tailwind)

```bash
npm install
npm run dev      # http://localhost:5173 (API palsu / localStorage)
npm run build    # type-check + build produksi
```

Hubungkan ke backend Go: `VITE_USE_MOCK=false` di `.env`. Request `/api/*` diteruskan ke `http://localhost:8080` (lihat `vite.config.ts`; route di Go harus berawalan `/api`).

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

`category` tidak dikirim bila filter "Semua".

### Bentuk JSON

```jsonc
// Task
{ "id":"1","title":"..","description":"..","category":"DevOps","url":"https://..","dueDate":"2026-10-30",
  "remindH3":true,"remindH1":true,"done":false }
// Transaction (amount = angka murni, date = ISO datetime)
{ "id":"1","type":"expense","description":"..","amount":1500000,"category":"Tagihan","method":"QRIS","date":"2026-10-26T14:30:00" }
// Bill
{ "id":"1","name":"..","amount":350000,"day":5,"remindH3":true,"remindH1":false }
// GET /finance/summary
{ "month":"2026-10","income":12500000,"expense":3200000,"balance":9300000,
  "incomeCount":1,"expenseCount":5,"billTotal":2030000,"billCount":3,
  "byCategory":[{"category":"Tagihan","amount":1950000}],   // pengeluaran per kategori, terbesar dulu
  "daily":[{"day":4,"expense":1500000}] }                    // pengeluaran per tanggal
```

Flag internal seperti `notified_h3` / `notified_h1` (apakah pesan sudah terkirim) cukup disimpan di database backend dan **tidak perlu** dikirim ke frontend. Frontend hanya mengirim `remindH3` dan `remindH1`.
