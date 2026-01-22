-- PlanetScale Database Schema for Predictive Markets Dashboard
-- Generated for migration from TypeScript types to MySQL

-- Users table (inferred from Answer and other types)
CREATE TABLE users (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Sources table removed - questions now only come from AI Agents

-- Questions table (main entity)
CREATE TABLE questions (
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
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    INDEX idx_state (state),
    INDEX idx_live_date (live_date),
    INDEX idx_answer_end_at (answer_end_at),
    INDEX idx_settlement_at (settlement_at),
    INDEX idx_created_at (created_at),
    INDEX idx_agent_id (agent_id),
    INDEX idx_ai_score (ai_score)
);

-- Proposed Questions table removed - consolidated into questions table with 'pending', 'approved', 'rejected' states

-- Categories table (normalized for better performance)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Question Categories junction table
CREATE TABLE question_categories (
    question_id VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (question_id, category_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Proposed Question Categories junction table removed - use question_categories instead

-- Tags table
CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Question Tags junction table
CREATE TABLE question_tags (
    question_id VARCHAR(36) NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Source-related junction tables removed - questions linked directly to agents

-- Risk Flags table
CREATE TABLE risk_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_severity (severity)
);

-- Question Risk Flags junction table
CREATE TABLE question_risk_flags (
    question_id VARCHAR(36) NOT NULL,
    risk_flag_id INT NOT NULL,
    PRIMARY KEY (question_id, risk_flag_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (risk_flag_id) REFERENCES risk_flags(id) ON DELETE CASCADE
);

-- Outcome Evidence table
CREATE TABLE outcome_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    evidence TEXT NOT NULL,
    evidence_type ENUM('url', 'text', 'document') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
);

-- Answers table
CREATE TABLE answers (
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
);

-- AI Agents table
CREATE TABLE agents (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
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
    INDEX idx_last_run (last_run),
    INDEX idx_category (category)
);

-- Agent Sources table (normalized from AgentSource interface)
CREATE TABLE agent_sources (
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

-- Connector Health table removed - no longer needed without sources

-- Audit Events table
CREATE TABLE audit_events (
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
);

-- AI Resolution Proposals table
CREATE TABLE ai_resolution_proposals (
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
);

-- KPI Stats table (for dashboard metrics)
CREATE TABLE kpi_stats (
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
);

-- Insert some initial categories
INSERT IGNORE INTO categories (name) VALUES
    ('Technology'),
    ('AI'),
    ('Cryptocurrency'),
    ('Finance'),
    ('Markets'),
    ('Apple'),
    ('Bitcoin');

-- Insert some initial risk flags
INSERT IGNORE INTO risk_flags (name, description, severity) VALUES
    ('api-error', 'Error occurred during API call', 'medium'),
    ('low-confidence', 'AI confidence score below threshold', 'low'),
    ('duplicate-question', 'Similar question already exists', 'medium'),
    ('controversial-topic', 'Question involves controversial subject matter', 'high'),
    ('insufficient-sources', 'Not enough reliable sources provided', 'medium');

-- Insert some initial tags
INSERT IGNORE INTO tags (name) VALUES
    ('crypto'),
    ('bitcoin'),
    ('price'),
    ('daily'),
    ('prediction'),
    ('market'),
    ('technology'),
    ('ai');