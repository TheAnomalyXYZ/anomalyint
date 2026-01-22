-- Migration: 001_initial_schema
-- Description: Initial schema creation for predictive markets dashboard
-- Date: 2025-10-30

-- Enable foreign key checks
SET foreign_key_checks = 1;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Sources table
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    type ENUM('twitter', 'news', 'meme') NOT NULL,
    url TEXT NOT NULL,
    title VARCHAR(500) NOT NULL,
    outlet VARCHAR(255),
    trust_level ENUM('high', 'medium', 'low'),
    fetched_at TIMESTAMP NOT NULL,
    content TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_trust_level (trust_level),
    INDEX idx_fetched_at (fetched_at)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Risk flags table
CREATE TABLE IF NOT EXISTS risk_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_severity (severity)
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    state ENUM('pending', 'approved', 'rejected', 'draft', 'awaiting_review', 'published', 'answering_closed', 'awaiting_resolution', 'resolved', 'invalid', 'paused') NOT NULL DEFAULT 'draft',
    live_date TIMESTAMP NULL,
    answer_end_at TIMESTAMP NOT NULL,
    settlement_at TIMESTAMP NOT NULL,
    resolution_criteria TEXT NOT NULL,
    topic VARCHAR(255),
    agent_id VARCHAR(36) NOT NULL,
    review_status ENUM('pending', 'approved', 'revision_requested'),
    outcome ENUM('YES', 'NO', 'INVALID'),
    answer_count INT DEFAULT 0,
    type VARCHAR(50) DEFAULT 'binary',
    pool_total DECIMAL(15,2) DEFAULT 0,
    pool_yes DECIMAL(15,2) DEFAULT 0,
    pool_no DECIMAL(15,2) DEFAULT 0,
    ai_score DECIMAL(3,2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_state (state),
    INDEX idx_live_date (live_date),
    INDEX idx_answer_end_at (answer_end_at),
    INDEX idx_settlement_at (settlement_at),
    INDEX idx_created_at (created_at),
    INDEX idx_agent_id (agent_id),
    INDEX idx_ai_score (ai_score)
);

-- Proposed Questions table removed - consolidated into questions table with 'pending', 'approved', 'rejected' states

-- AI Agents table
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    question_prompt TEXT NOT NULL,
    resolution_prompt TEXT NOT NULL,
    base_model VARCHAR(100) NOT NULL DEFAULT 'chatgpt-4o-latest',
    frequency ENUM('daily', 'on_update', 'weekly') NOT NULL DEFAULT 'daily',
    status ENUM('active', 'paused', 'error') NOT NULL DEFAULT 'active',
    questions_created INT DEFAULT 0,
    last_run TIMESTAMP NULL,
    next_run TIMESTAMP NULL,
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_frequency (frequency),
    INDEX idx_is_template (is_template),
    INDEX idx_next_run (next_run),
    INDEX idx_last_run (last_run)
);

-- Agent Sources table
CREATE TABLE IF NOT EXISTS agent_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    type ENUM('website', 'api', 'x', 'reddit', 'feed') NOT NULL,
    config_url TEXT,
    config_subreddit VARCHAR(255),
    config_api_endpoint TEXT,
    config_feed_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_agent_id (agent_id),
    INDEX idx_type (type)
);

-- Junction tables
CREATE TABLE IF NOT EXISTS question_categories (
    question_id VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (question_id, category_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_tags (
    question_id VARCHAR(36) NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    source_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_source_id (source_id)
);

CREATE TABLE IF NOT EXISTS question_risk_flags (
    question_id VARCHAR(36) NOT NULL,
    risk_flag_id INT NOT NULL,
    PRIMARY KEY (question_id, risk_flag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (risk_flag_id) REFERENCES risk_flags(id) ON DELETE CASCADE
);

-- Add foreign key constraint for questions.agent_id
ALTER TABLE questions ADD CONSTRAINT fk_questions_agent_id
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- Insert initial data
INSERT IGNORE INTO categories (name) VALUES
    ('Technology'), ('AI'), ('Cryptocurrency'), ('Finance'),
    ('Markets'), ('Apple'), ('Bitcoin');

INSERT IGNORE INTO tags (name) VALUES
    ('crypto'), ('bitcoin'), ('price'), ('daily'),
    ('prediction'), ('market'), ('technology'), ('ai');

INSERT IGNORE INTO risk_flags (name, description, severity) VALUES
    ('api-error', 'Error occurred during API call', 'medium'),
    ('low-confidence', 'AI confidence score below threshold', 'low'),
    ('duplicate-question', 'Similar question already exists', 'medium'),
    ('controversial-topic', 'Question involves controversial subject matter', 'high'),
    ('insufficient-sources', 'Not enough reliable sources provided', 'medium');