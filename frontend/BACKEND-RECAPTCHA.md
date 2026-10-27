# Instruksi Backend: reCAPTCHA pada Registrasi

Frontend (halaman Daftar) sudah menampilkan reCAPTCHA v2 "Saya bukan robot" di atas tombol **Daftar** dan mengirim
tokennya ke backend. Backend wajib memverifikasi token itu ke Google. Tanpa verifikasi server, widget di frontend
tidak melindungi apa pun karena penyerang bisa memanggil API langsung.

> **Penting, rotasi secret key.** Screenshot yang dikirim memperlihatkan *site key* sekaligus *secret key*.
> Anggap secret key itu sudah bocor: buka https://www.google.com/recaptcha/admin, pilih situs `taskflow`,
> buat key baru (atau hapus dan daftarkan ulang), lalu pakai pasangan key yang baru. Jangan pernah menaruh
> secret key di frontend, di repo Git, atau di chat/screenshot. Site key boleh publik.

## Ringkasan perubahan

| # | Perubahan | Jenis |
|---|---|---|
| 1 | Env `RECAPTCHA_SECRET` (+ opsi lain) | baru |
| 2 | Field `recaptchaToken` pada `POST /api/auth/register` | ubah |
| 3 | Fungsi `verifyRecaptcha` (panggil Google siteverify) | baru |
| 4 | Urutan pemeriksaan dan kode error | ubah |
| 5 | Pengaman tambahan (rate limit, timeout, log) | baru |
| 6 | Uji + README | ubah |

Tidak ada perubahan database. `POST /api/auth/login` dan endpoint lain tidak berubah (CAPTCHA hanya untuk registrasi).

## 1. Konfigurasi

```env
RECAPTCHA_SECRET=...            # secret key v2 BARU hasil rotasi, hanya di server
RECAPTCHA_ENABLED=true          # false hanya untuk development lokal tanpa internet
RECAPTCHA_ALLOWED_HOSTNAMES=localhost,taskflow.example.com   # domain yang sah (lihat poin 3)
```

- Baca saat start. Bila `RECAPTCHA_ENABLED=true` dan `RECAPTCHA_SECRET` kosong, **hentikan aplikasi dengan pesan jelas**
  (jangan diam-diam menonaktifkan verifikasi).
- Untuk lingkungan produksi paksa `RECAPTCHA_ENABLED=true` (tolak start bila `APP_ENV=production` dan nilainya false).
- Tambahkan nama variabel (tanpa nilai) ke `.env.example` backend dan `README`.

## 2. Request register (kontrak baru)

`POST /api/auth/register`

```json
{ "name": "Nufail", "email": "a@b.com", "password": "abc12345", "recaptchaToken": "03AFcWeA..." }
```

```go
type RegisterRequest struct {
    Name           string `json:"name"`
    Email          string `json:"email"`
    Password       string `json:"password"`
    RecaptchaToken string `json:"recaptchaToken"`
}
```

Token berasal dari widget, panjangnya ratusan karakter, **sekali pakai**, dan kedaluwarsa sekitar 2 menit.
Frontend tidak mengirim `confirmPassword`.

## 3. Verifikasi ke Google

Endpoint: `POST https://www.google.com/recaptcha/api/siteverify`, body `application/x-www-form-urlencoded`:

| Field | Isi |
|---|---|
| `secret` | `RECAPTCHA_SECRET` |
| `response` | `recaptchaToken` dari request |
| `remoteip` | (opsional) IP klien asli; kirim hanya bila Anda yakin IP-nya benar (hati-hati di belakang proxy) |

Respons JSON Google:

```json
{ "success": true, "challenge_ts": "2026-10-27T01:50:00Z", "hostname": "taskflow.example.com", "error-codes": [] }
```

Contoh Go (standar library saja):

```go
type siteVerifyResp struct {
    Success    bool     `json:"success"`
    Hostname   string   `json:"hostname"`
    ErrorCodes []string `json:"error-codes"`
}

var captchaClient = &http.Client{Timeout: 5 * time.Second} // jangan pakai http.DefaultClient (tanpa timeout)

// Mengembalikan (true, nil) bila lolos; (false, nil) bila token ditolak; (false, err) bila Google tidak dapat dihubungi.
func verifyRecaptcha(ctx context.Context, token, remoteIP string) (bool, error) {
    if token == "" || len(token) > 4096 { // cegah kirim sampah ke Google
        return false, nil
    }
    form := url.Values{"secret": {cfg.RecaptchaSecret}, "response": {token}}
    if remoteIP != "" {
        form.Set("remoteip", remoteIP)
    }
    req, _ := http.NewRequestWithContext(ctx, http.MethodPost,
        "https://www.google.com/recaptcha/api/siteverify", strings.NewReader(form.Encode()))
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
        // error-codes bisa: missing-input-response, invalid-input-response, timeout-or-duplicate,
        // invalid-input-secret (secret salah -> bug konfigurasi, catat sebagai ERROR bukan sebagai input pengguna)
        if slices.Contains(out.ErrorCodes, "invalid-input-secret") || slices.Contains(out.ErrorCodes, "missing-input-secret") {
            return false, fmt.Errorf("recaptcha secret ditolak Google: %v", out.ErrorCodes)
        }
        return false, nil
    }
    // Pastikan token dibuat di domain milik kita (bukan situs lain yang memakai site key bocor)
    if len(cfg.RecaptchaAllowedHostnames) > 0 && !slices.Contains(cfg.RecaptchaAllowedHostnames, out.Hostname) {
        return false, nil
    }
    return true, nil
}
```

## 4. Urutan di handler register dan kode error

Jalankan **setelah validasi bentuk request, tetapi sebelum pekerjaan mahal/berefek** (hash bcrypt, query cek email, insert user):

1. Body bukan JSON valid / field wajib kosong -> `400` `{"error":"Data tidak lengkap"}` (perilaku lama).
2. `recaptchaToken` kosong -> `400` `{"error":"Verifikasi reCAPTCHA gagal, silakan coba lagi."}`.
3. Panggil `verifyRecaptcha` dengan `context` ber-timeout.
   - `(false, nil)` (ditolak/kedaluwarsa/sudah dipakai/hostname salah) -> `400` `{"error":"Verifikasi reCAPTCHA gagal, silakan coba lagi."}`.
   - `(false, err)` (Google tidak terjangkau, secret salah, status bukan 200) -> **fail closed**: `503`
     `{"error":"Layanan verifikasi sedang bermasalah, coba beberapa saat lagi."}`. Jangan loloskan pendaftaran saat verifikasi error.
     Catat `err` ke log server (tanpa token dan tanpa secret).
4. Lolos -> lanjutkan alur lama (cek email -> `409 "Email sudah terdaftar"`, hash password, simpan, kembalikan `201 {token, user}`).

Frontend menampilkan isi `error` apa adanya untuk 400 dan pesan generik "Server sedang bermasalah" untuk 5xx, lalu me-reset widget
supaya pengguna mencentang lagi. Pesan 400 harus ramah pengguna dan berbahasa Indonesia seperti di atas.

Karena token sekali pakai, **satu token = satu percobaan register**. Jangan memverifikasi ulang token yang sama (Google akan menjawab `timeout-or-duplicate`).

## 5. Pengaman tambahan

- Rate limit `POST /api/auth/register` per IP (mis. 5 request/menit, burst 5) agar CAPTCHA tidak jadi satu-satunya pertahanan; balas `429` dengan `{"error":"Terlalu banyak percobaan, coba lagi nanti."}`.
- Jangan pernah mencatat `recaptchaToken` atau `RECAPTCHA_SECRET` ke log, response, atau pesan error.
- Pastikan konfigurasi CORS/proxy tidak diubah; request ke Google keluar dari server, bukan dari browser.
- Server harus bisa keluar ke `www.google.com:443` (cek firewall/egress di lingkungan deploy).
- Di konsol reCAPTCHA admin, daftarkan domain frontend (`localhost` untuk development, domain produksi) dan jenis key harus **reCAPTCHA v2 "Kotak centang 'Saya bukan robot'"**. Key v3 atau Invisible tidak cocok dengan widget ini.

## 6. Uji

Untuk uji otomatis/CI jangan memakai key asli. Google menyediakan key uji publik (selalu lolos):
site key `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` dan secret `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`.
Dengan pasangan itu semua token dianggap valid, sehingga cocok untuk pengujian alur; abstraksikan `verifyRecaptcha`
lewat interface agar mudah di-mock pada unit test.

Skenario (tambahkan ke `tools/verify-api.mjs` atau uji Go):

- Register tanpa `recaptchaToken` -> `400`, pesan reCAPTCHA, tidak ada user baru di DB.
- Token palsu `"x"` dengan key asli -> `400`.
- Token valid (key uji) + data benar -> `201` dan user tersimpan.
- Token valid tetapi email sudah ada -> `409` (urutan: CAPTCHA dulu, lalu cek email).
- Google tidak terjangkau (arahkan URL ke host mati / timeout) -> `503`, tidak ada user baru.
- Secret salah -> `503` + log ERROR (bukan 400).
- Login tidak terpengaruh (tetap tanpa token).
- Request ke-6 dalam semenit dari IP yang sama -> `429`.

Perbarui tabel "Kontrak API" di `README.md`: tambahkan `recaptchaToken` pada body `POST /api/auth/register`
dan sebutkan kode `400/503` baru di atas.
