-- Migration: 002_ai_resolution_proposals
-- Description: Add AI resolution proposals table for automated market resolution
-- Date: 2025-10-31

-- Enable foreign key checks
SET foreign_key_checks = 1;

-- AI Resolution Proposals table
CREATE TABLE IF NOT EXISTS ai_resolution_proposals (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL UNIQUE,
    resolution ENUM('YES', 'NO', 'INVALID') NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL COMMENT 'Confidence score between 0.0000 and 1.0000',
    reasoning TEXT NOT NULL COMMENT 'AI explanation for the resolution decision',
    evidence JSON COMMENT 'Supporting evidence and data points',
    status ENUM('pending', 'approved', 'rejected', 'under_review') NOT NULL DEFAULT 'pending',
    created_by VARCHAR(255) NOT NULL DEFAULT 'AI',
    reviewed_by VARCHAR(36) NULL COMMENT 'User ID of reviewer',
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_question_id (question_id),
    INDEX idx_status (status),
    INDEX idx_resolution (resolution),
    INDEX idx_confidence_score (confidence_score),
    INDEX idx_created_at (created_at),
    INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Outcome Evidence table (if it doesn't exist from schema.sql)
CREATE TABLE IF NOT EXISTS outcome_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    evidence TEXT NOT NULL,
    evidence_type ENUM('url', 'text', 'document') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Answers table (if it doesn't exist from migration 001)
CREATE TABLE IF NOT EXISTS answers (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    question_title VARCHAR(1000) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    choice ENUM('YES', 'NO') NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    channel VARCHAR(50) NOT NULL DEFAULT 'web',
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_user_id (user_id),
    INDEX idx_placed_at (placed_at),
    INDEX idx_choice (choice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- KPI Stats table (for dashboard metrics)
CREATE TABLE IF NOT EXISTS kpi_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    value_numeric DECIMAL(15,2),
    value_text VARCHAR(500),
    change_percentage DECIMAL(5,2),
    trend ENUM('up', 'down', 'neutral') DEFAULT 'neutral',
    date_recorded DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_label (label),
    INDEX idx_date_recorded (date_recorded),
    INDEX idx_trend (trend)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Events table (for tracking changes)
CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    changes JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_actor (actor),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
