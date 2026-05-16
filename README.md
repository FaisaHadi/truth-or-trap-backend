# TRUTH OR TRAP

Aplikasi *Interactive Storytelling Multiplayer* untuk melatih kemampuan analisis fakta vs hoaks. Proyek ini dibangun untuk UAS Pemrograman Web dan terbagi menjadi dua bagian: Frontend (Next.js) dan Backend (Node.js/Express).

## Persyaratan Sistem (Prerequisites)
- Node.js (Versi 18 atau lebih direkomendasikan)
- MySQL Server berjalan di mesin lokal atau remote

---

## 1. Setup Database
Aplikasi ini memerlukan skema tabel dasar agar berfungsi dengan baik.

1. Buka *client* MySQL Anda (misal: phpMyAdmin, DBeaver, atau Terminal/Command Prompt).
2. Buat database baru:
   ```sql
   CREATE DATABASE truth_or_trap;
   ```
3. Impor struktur tabel dan *seed data* dengan menjalankan file `schema.sql` yang berada di folder backend:
   ```bash
   mysql -u root -p truth_or_trap < "backend-pemweb/database/schema.sql"
   ```

---

## 2. Setup Backend (Server & API)
Backend bertanggung jawab untuk autentikasi, manajemen relasi data, dan mesin game realtime.

1. Buka terminal dan arahkan *working directory* ke folder backend:
   ```bash
   cd backend-pemweb
   ```
2. Instal semua dependensi proyek:
   ```bash
   npm install
   ```
3. Konfigurasi variabel environment:
   Buat file bernama `.env` di *root* folder `backend-pemweb` dan sesuaikan dengan kredensial MySQL Anda:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=password_database_anda
   DB_NAME=truth_or_trap
   JWT_SECRET=rahasia_jwt_anda_disini
   ```
4. Jalankan Server:
   ```bash
   npm run dev
   ```
   *Server sekarang seharusnya berjalan di `http://localhost:5000`.*

---

## 3. Setup Frontend (Client Web)
Frontend merupakan antarmuka bagi pengguna untuk bermain.

1. Buka tab/jendela terminal baru, dan arahkan ke folder frontend:
   ```bash
   cd frontend-pemweb
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi koneksi ke server Backend:
   Buat file bernama `.env.local` di *root* folder `frontend-pemweb`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```
4. Jalankan Aplikasi Web:
   ```bash
   npm run dev
   ```
   *Aplikasi kini dapat diakses melalui browser di `http://localhost:3000`.*

---

## Cara Bermain
1. Akses web di `http://localhost:3000`.
2. Lakukan pendaftaran akun atau masuk sebagai *Admin* menggunakan data bawaan dari database:
   - **Email:** `admin@truthortrap.id`
   - **Password:** `Admin@1234`
3. Setelah masuk, buat "Operasi Baru" (Room) melalui halaman Lobby Utama.
4. Anda akan masuk ke halaman ruang tunggu. Bagikan **ID Room** kepada pemain lain untuk bergabung.
5. Di ruang tunggu, setiap pemain harus menekan tombol **TANDAI SIAP**.
6. Ketika semua agen sudah siap, status akan berubah dan Host dapat menekan tombol **MULAI GAME**.
7. Ikuti alur cerita, diskusikan kejanggalan dalam *chat*, dan putuskan (vote) bersama-sama apakah itu FAKTA atau HOAKS!
