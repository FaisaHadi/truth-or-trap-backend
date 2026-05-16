-- ============================================================
-- Truth or Trap — Complete Database Schema (v2)
-- Merged schema + storytelling migration
-- Run this on a fresh database for clean setup
-- ============================================================

CREATE DATABASE IF NOT EXISTS truth_or_trap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE truth_or_trap;

-- ── USERS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(30)  NOT NULL UNIQUE,
  email        VARCHAR(100) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('player','admin') NOT NULL DEFAULT 'player',
  avatar       VARCHAR(255) DEFAULT NULL,
  trust_score  SMALLINT     NOT NULL DEFAULT 100,
  reputation   INT          NOT NULL DEFAULT 0,
  is_online    TINYINT(1)   NOT NULL DEFAULT 0,
  last_seen    DATETIME     DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email  (email),
  INDEX idx_online (is_online),
  INDEX idx_rep    (reputation DESC)
) ENGINE=InnoDB;

-- ── NEWS ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,
  category    VARCHAR(60)  NOT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  is_hoax     TINYINT(1)   NOT NULL DEFAULT 0,
  explanation TEXT         NOT NULL,
  difficulty  ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  status      ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  created_by  INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status     (status),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB;

-- ── SCENARIOS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,
  image_url   VARCHAR(500) DEFAULT NULL,
  is_start    TINYINT(1)   NOT NULL DEFAULT 0,
  is_end      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── SCENARIO CHOICES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenario_choices (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scenario_id      INT UNSIGNED NOT NULL,
  text             VARCHAR(500) NOT NULL,
  next_scenario_id INT UNSIGNED DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id)      REFERENCES scenarios(id) ON DELETE CASCADE,
  FOREIGN KEY (next_scenario_id) REFERENCES scenarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── ROOMS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  code                VARCHAR(10)  NOT NULL UNIQUE,
  host_id             INT UNSIGNED NOT NULL,
  news_id             INT UNSIGNED DEFAULT NULL,
  current_scenario_id INT UNSIGNED DEFAULT NULL,
  game_timer          INT          DEFAULT 60,
  max_players         TINYINT      NOT NULL DEFAULT 10,
  is_private          TINYINT(1)   NOT NULL DEFAULT 0,
  password            VARCHAR(100) DEFAULT NULL,
  status              ENUM('waiting','active','closed') NOT NULL DEFAULT 'waiting',
  started_at          DATETIME     DEFAULT NULL,
  ended_at            DATETIME     DEFAULT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id)             REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (news_id)             REFERENCES news(id)      ON DELETE SET NULL,
  FOREIGN KEY (current_scenario_id) REFERENCES scenarios(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_code   (code)
) ENGINE=InnoDB;

-- ── ROOM MEMBERS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_members (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  is_ready  TINYINT(1)   NOT NULL DEFAULT 0,
  joined_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at   DATETIME     DEFAULT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_room_user (room_id, user_id),
  INDEX idx_room (room_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ── MESSAGES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id      INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  content      TEXT         NOT NULL,
  message_type ENUM('text','system','vote_action') NOT NULL DEFAULT 'text',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
  INDEX idx_room_msg (room_id, created_at)
) ENGINE=InnoDB;

-- ── VOTES ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  choice_id     INT UNSIGNED NOT NULL,
  points_earned SMALLINT     NOT NULL DEFAULT 10,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id)            ON DELETE CASCADE,
  FOREIGN KEY (choice_id) REFERENCES scenario_choices(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_choice (user_id, choice_id),
  INDEX idx_choice_votes (choice_id)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: Admin@1234)
INSERT IGNORE INTO users (username, email, password, role, trust_score, reputation)
VALUES ('admin','admin@truthortrap.id','$2a$12$Aznczv7AlMapZC23e5zWcezU3Ljoc0keOZOB7fu8aoCOOQE6fIGpO','admin',200,9999);

-- ── Story Seed: "Gempa Digital - Divisi SIGMA" ────────────────────────────────
INSERT IGNORE INTO scenarios (id, title, content, is_start) VALUES
(1, 'Skenario 1.1: Gempa Digital',
 'Tim SIGMA menerima laporan pertama. Sebuah video viral beredar di semua platform: "BREAKING: Gempa M 7.8 direncanakan terjadi di Nusantara Digital besok pukul 14.00 akibat uji coba senjata frekuensi milik pemerintah asing!" Video ini sudah ditonton 5 juta kali dalam 3 jam dan menyebabkan ribuan warga mulai mengungsi.',
 1);

INSERT IGNORE INTO scenarios (id, title, content) VALUES
(2, 'Skenario 1.2: Dokumen Bocoran',
 'Seorang informan anonim mengirim file terenkripsi kepada tim. Isinya: dokumen yang mengklaim sebagai "kebocoran data internal" sebuah perusahaan media besar — menunjukkan bahwa mereka sengaja memproduksi konten sensasional untuk menaikkan traffic iklan. PT. MediaNusa mengklaim dokumen itu palsu.'),
(3, 'Skenario 1.2-alt: Krisis Kepercayaan',
 'Akibat kesalahan sebelumnya, publik mulai menyerang Divisi SIGMA di media sosial. Tagar #BubarSIGMA trending. Lebih parah lagi, muncul petisi online yang menuntut tim dibubarkan — dengan 50.000 tanda tangan dalam 2 jam. Kini tim harus memilih: bertahan atau akui kesalahan?'),
(4, 'Skenario 1.3: Identitas Penyebar Pertama',
 'Tim SIGMA berhasil melacak IP address akun penyebar hoaks pertama. Hasilnya mengejutkan: akun tersebut terhubung ke Benny Hartono, seorang influencer dengan 2 juta pengikut yang dikenal sebagai "pejuang kebenaran digital."'),
(5, 'Skenario 2.1-A: Media Mainstream Terlibat?',
 'Setelah Benny Hartono dilaporkan, penyelidikan polisi membuka fakta baru: ada 3 media online mainstream yang secara konsisten memperkuat narasi hoaks yang disebarkan Benny — tanpa verifikasi. Apakah ini kelalaian atau kesengajaan?'),
(6, 'Skenario 2.1-B: Dark Web Leak',
 'Penyelidikan lebih dalam membawa tim ke sebuah forum di dark web. Di sana, ditemukan "Paket Hoaks Siap Pakai". Yang mengejutkan: nama Benny Hartono ada di daftar akun bayaran tersebut. Dia bukan dalang — dia hanya alat.'),
(7, 'Skenario 2.2: Uang di Balik Berita',
 'Semua jalan menuju satu nama yang sama: PT. Nexus Infomedia — sebuah perusahaan manajemen konten. Di permukaan, mereka adalah konsultan digital biasa. Di baliknya, mereka adalah mesin produksi hoaks terorganisir. Klien mereka mencakup figur politik, kompetitor bisnis, dan lembaga tertentu.'),
(8, 'Skenario 2.3: Sumber Anonim',
 'Tim SIGMA kini hampir mengetahui seluruh jaringan. Tapi tiba-tiba muncul pesan anonim yang mengklaim sebagai orang dalam PT. Nexus — menawarkan informasi tentang siapa klien terbesar mereka, dengan satu syarat: tim harus berhenti menyelidiki secara resmi.'),
(9, 'Skenario 3.1: Laporan Terakhir Tim',
 'Tim SIGMA kini memiliki semua bukti yang dibutuhkan. Laporan final sudah disusun. Tapi ada dilema terakhir: salah satu klien terbesar PT. Nexus ternyata adalah pejabat tinggi yang juga menjadi pelindung tidak resmi Divisi SIGMA.'),
(10, 'Skenario 3.2: Konfrontasi Dalang',
 'Laporan sudah terbit (atau sedang ditunda). Tapi direktur PT. Nexus tiba-tiba menghilang. Yang tersisa hanyalah pesan terenkripsi: "Kalian pikir sudah menang? Ada satu file yang belum kalian temukan. File itu akan menghancurkan kalian."'),
(11, 'Skenario 3.3 (FINAL): Sidang Kebenaran Digital',
 'Hari penentuan. Tim SIGMA dipanggil ke sidang digital publik. Pengacara PT. Nexus mengajukan pertanyaan yang mengguncang segalanya: "Bukankah Divisi SIGMA sendiri pernah mengambil keputusan yang merusak kepercayaan publik? Siapa yang berhak menghakimi kebenaran?" Semua mata tertuju pada tim.');

INSERT IGNORE INTO scenarios (id, title, content, is_end) VALUES
(12, 'ENDING: PAHLAWAN DIGITAL',
 'Divisi SIGMA berhasil mengungkap seluruh jaringan hoaks secara transparan. Direktur PT. Nexus ditangkap. Pejabat terlibat mengundurkan diri. Undang-undang literasi digital baru disahkan. Nama SIGMA dikenang sebagai fondasi era informasi yang lebih bersih di Nusantara Digital.', 1),
(13, 'ENDING: KOMPROMI TERAKHIR',
 'Tim memilih jalan tengah. Sebagian kebenaran terungkap, sebagian dikubur. Pejabat berterima kasih — SIGMA mendapat perlindungan, tapi kehilangan integritasnya. Kota aman untuk sementara, tapi sistem korup tetap berjalan.', 1);

INSERT IGNORE INTO scenario_choices (id, scenario_id, text, next_scenario_id) VALUES
(1, 1, '🔴 Ini HOAKS — Laporkan & Klarifikasi', 2),
(2, 1, '🟢 Ini FAKTA — Sebarkan Peringatan', 3),

(3, 2, '🔍 Selidiki Lebih Dalam Dulu', 4),
(4, 2, '📢 Sebarkan — Publik Berhak Tahu', 4),

(5, 3, '🤝 Akui Kesalahan & Minta Maaf Publik', 4),
(6, 3, '🛡️ Bertahan & Lanjutkan Misi Diam-diam', 4),

(7, 4, '📋 Laporkan ke Pihak Berwenang Sekarang', 5),
(8, 4, '🔬 Selidiki Lebih Dalam — Mungkin Ada Dalang', 6),

(9, 5, '🚨 Ini Disengaja — Ekspos Ketiga Media', 7),
(10, 5, '⚠️ Bisa Jadi Kelalaian — Investigasi Internal Dulu', 7),

(11, 6, '📍 Lacak Lokasi Gedung — Operasi Lapangan', 7),
(12, 6, '💻 Analisis Digital Lebih Dalam Dulu', 7),

(13, 7, '📁 Amankan Database — Ini Bukti Kunci', 8),
(14, 7, '🤝 Jadikan Salah Satu Karyawan Informan', 8),

(15, 8, '❌ Tolak — Proses Harus Resmi & Transparan', 9),
(16, 8, '✅ Terima — Dapatkan Nama Klien Terbesar', 9),

(17, 9, '🌐 Publish Semua — Kebenaran di Atas Segalanya', 10),
(18, 9, '⏳ Tunda — Negosiasi Dulu dengan Pejabat', 10),

(19, 10, '💪 Gertakan Kosong — Lanjutkan & Cari File Itu', 11),
(20, 10, '🔒 Amankan Tim Dulu — Evakuasi Data', 11),

(21, 11, '⚡ UNGKAP SEMUA — Termasuk Kesalahan Tim Sendiri', 12),
(22, 11, '🤝 KOMPROMIS — Ungkap Sebagian, Lindungi Tim', 13);

-- ── Sample news items ─────────────────────────────────────────────────────────
INSERT IGNORE INTO news (id, title, content, category, is_hoax, explanation, difficulty, status, created_by) VALUES
(1,'Vaksin COVID-19 Mengandung Microchip','Beredar informasi bahwa vaksin COVID-19 mengandung microchip yang ditanam pemerintah untuk melacak warga.','Kesehatan',1,'HOAKS. Vaksin tidak mengandung microchip. Dibantah oleh WHO dan CDC.','easy','published',1),
(2,'Indonesia Resmi Jadi Anggota BRICS 2025','Presiden Prabowo mengumumkan Indonesia bergabung dengan BRICS pada Januari 2025.','Politik',0,'FAKTA. Indonesia resmi bergabung dengan BRICS pada Januari 2025.','medium','published',1),
(3,'Indonesia Luncurkan Satelit SATRIA-1','Satelit SATRIA-1 berhasil diluncurkan dari Cape Canaveral menggunakan roket SpaceX Falcon 9.','Teknologi',0,'FAKTA. SATRIA-1 diluncurkan 19 Juni 2023, berkapasitas 150 Gbps.','hard','published',1);
