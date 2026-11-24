-- Archdiocese of Nyeri Youth Management System - MySQL / MariaDB Schema
-- Import this file in HostPinnacle cPanel -> phpMyAdmin into your database.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admin_config (
  id TINYINT PRIMARY KEY,
  username VARCHAR(64) NOT NULL DEFAULT 'admin',
  password_hash VARCHAR(255) NOT NULL,
  updated_at VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deaneries (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  payload_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parishes (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  deanery_id VARCHAR(100) NOT NULL,
  annual_levy_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  payload_json LONGTEXT NOT NULL,
  INDEX idx_parishes_deanery (deanery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS youth_members (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  movement VARCHAR(64) NOT NULL,
  deanery_id VARCHAR(100) NOT NULL,
  parish_id VARCHAR(100) NOT NULL,
  deanery_name VARCHAR(191) NULL,
  parish_name VARCHAR(191) NULL,
  local_church VARCHAR(191) NULL,
  approval_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  batch_id VARCHAR(64) NULL,
  mpesa_ref VARCHAR(64) NULL,
  password_hash VARCHAR(255) NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_members_movement (movement),
  INDEX idx_members_batch (batch_id),
  INDEX idx_members_phone (phone),
  INDEX idx_members_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parish_batches (
  id VARCHAR(64) PRIMARY KEY,
  leader_phone VARCHAR(64) NOT NULL,
  leader_name VARCHAR(191) NOT NULL,
  deanery_name VARCHAR(191) NOT NULL,
  parish_name VARCHAR(191) NOT NULL,
  local_church VARCHAR(191) NOT NULL,
  member_count INT NOT NULL DEFAULT 0,
  total_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  mpesa_code VARCHAR(64) NOT NULL,
  approval_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  password_hash VARCHAR(255) NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_batches_phone (leader_phone),
  INDEX idx_batches_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parish_leaders (
  leader_phone VARCHAR(64) PRIMARY KEY,
  leader_name VARCHAR(191) NOT NULL,
  deanery_name VARCHAR(191) NOT NULL,
  parish_name VARCHAR(191) NOT NULL,
  local_church VARCHAR(191) NOT NULL,
  batch_id VARCHAR(64) NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nicca_students (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(191) NOT NULL,
  institution VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  mpesa_code VARCHAR(64) NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 100,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'Paid',
  password_hash VARCHAR(255) NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_nicca_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS challenge_teams (
  id VARCHAR(64) PRIMARY KEY,
  team_name VARCHAR(191) NOT NULL,
  registration_type VARCHAR(32) NULL,
  deanery_name VARCHAR(191) NOT NULL,
  parish_name VARCHAR(191) NOT NULL,
  local_church VARCHAR(191) NULL,
  team_leader_name VARCHAR(191) NOT NULL,
  team_leader_phone VARCHAR(64) NOT NULL,
  members_count INT NOT NULL DEFAULT 1,
  total_fee DECIMAL(12,2) NOT NULL DEFAULT 1000,
  mpesa_code VARCHAR(64) NULL,
  payment_status VARCHAR(32) NOT NULL DEFAULT 'Pending Verification',
  username VARCHAR(120) NULL,
  password_hash VARCHAR(255) NULL,
  login_pin_hash VARCHAR(255) NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_challenge_phone (team_leader_phone),
  INDEX idx_challenge_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS career_registrations (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(191) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  username VARCHAR(120) NULL,
  school VARCHAR(191) NULL,
  grade_attained VARCHAR(64) NULL,
  desired_course VARCHAR(191) NULL,
  home_area_parish VARCHAR(191) NULL,
  password_hash VARCHAR(255) NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_career_phone (phone),
  INDEX idx_career_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS matrons_patrons (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(191) NOT NULL,
  role VARCHAR(64) NOT NULL,
  deanery_name VARCHAR(191) NULL,
  parish_name VARCHAR(191) NULL,
  local_church VARCHAR(191) NULL,
  phone VARCHAR(64) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 100,
  mpesa_code VARCHAR(64) NULL,
  password_hash VARCHAR(255) NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  INDEX idx_matrons_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS secondary_youth (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(191) NOT NULL,
  school_name VARCHAR(191) NOT NULL,
  form_level VARCHAR(32) NOT NULL,
  phone_or_parent_phone VARCHAR(64) NOT NULL,
  home_parish VARCHAR(191) NOT NULL,
  home_deanery VARCHAR(191) NOT NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(191) NOT NULL,
  scope VARCHAR(64) NOT NULL,
  start_date VARCHAR(40) NOT NULL,
  status VARCHAR(32) NOT NULL,
  payload_json LONGTEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS remittances (
  id VARCHAR(64) PRIMARY KEY,
  receipt_no VARCHAR(64) NOT NULL,
  parish_id VARCHAR(100) NOT NULL,
  deanery_id VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  mpesa_ref VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vocations (
  id VARCHAR(64) PRIMARY KEY,
  member_id VARCHAR(64) NOT NULL,
  aspirant_name VARCHAR(191) NOT NULL,
  vocation_type VARCHAR(100) NOT NULL,
  stage VARCHAR(64) NOT NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS welfare (
  id VARCHAR(64) PRIMARY KEY,
  member_id VARCHAR(64) NOT NULL,
  member_name VARCHAR(191) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(32) NOT NULL,
  payload_json LONGTEXT NOT NULL,
  created_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
