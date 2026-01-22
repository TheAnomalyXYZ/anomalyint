-- Migration: 002_agents_and_analytics
-- Description: Add AI agents, analytics, and audit functionality
-- Date: 2025-10-30

-- AI Agents table
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    question_prompt TEXT NOT NULL,
    resolution_prompt TEXT NOT NULL,
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

-- Answers table
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
);

-- Outcome Evidence table
CREATE TABLE IF NOT EXISTS outcome_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL,
    evidence TEXT NOT NULL,
    evidence_type ENUM('url', 'text', 'document') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
);

-- Connector Health table
CREATE TABLE IF NOT EXISTS connector_health (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('twitter', 'news', 'meme') NOT NULL,
    last_run TIMESTAMP NULL,
    status ENUM('healthy', 'warning', 'error') NOT NULL DEFAULT 'healthy',
    items_ingested INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_last_run (last_run)
);

-- Audit Events table
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
);

-- KPI Stats table
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
);