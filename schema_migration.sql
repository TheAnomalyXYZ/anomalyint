-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('twitter', 'news', 'meme');

-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "QuestionState" AS ENUM ('pending', 'approved', 'rejected', 'draft', 'awaiting_review', 'published', 'answering_closed', 'awaiting_resolution', 'resolved', 'invalid', 'paused');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'revision_requested');

-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('YES', 'NO', 'INVALID');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('binary', 'multi-option');

-- CreateEnum
CREATE TYPE "AgentSourceType" AS ENUM ('website', 'api', 'x', 'reddit', 'feed');

-- CreateEnum
CREATE TYPE "AgentFrequency" AS ENUM ('daily', 'on_update', 'weekly');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('active', 'paused', 'error');

-- CreateEnum
CREATE TYPE "Choice" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('url', 'text', 'document');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('healthy', 'warning', 'error');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "Trend" AS ENUM ('up', 'down', 'neutral');

-- CreateEnum
CREATE TYPE "ResolutionProposalStatus" AS ENUM ('pending', 'approved', 'rejected', 'under_review');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "url" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "outlet" TEXT,
    "trust_level" "TrustLevel",
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_flags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "severity" "RiskSeverity" NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(1000) NOT NULL,
    "description" TEXT,
    "state" "QuestionState" NOT NULL DEFAULT 'draft',
    "live_date" TIMESTAMP(3),
    "answer_end_at" TIMESTAMP(3) NOT NULL,
    "settlement_at" TIMESTAMP(3) NOT NULL,
    "resolution_criteria" TEXT NOT NULL,
    "topic" TEXT,
    "agent_id" TEXT NOT NULL,
    "pushed_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "review_status" "ReviewStatus",
    "outcome" "Outcome",
    "answer_count" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT DEFAULT 'binary',
    "pool_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pool_yes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pool_no" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nova_ratings" (
    "id" SERIAL NOT NULL,
    "question_id" TEXT NOT NULL,
    "rating" VARCHAR(1) NOT NULL,
    "rating_category" VARCHAR(100) NOT NULL,
    "confidence" INTEGER,
    "sparkline" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nova_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_resolution_proposals" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "resolution" "Outcome" NOT NULL,
    "confidence_score" DECIMAL(5,4) NOT NULL,
    "reasoning" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "ResolutionProposalStatus" NOT NULL DEFAULT 'pending',
    "created_by" TEXT NOT NULL DEFAULT 'AI',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_resolution_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "question_prompt" TEXT NOT NULL,
    "resolution_prompt" TEXT,
    "base_model" VARCHAR(100) NOT NULL DEFAULT 'chatgpt-4o-latest',
    "frequency" "AgentFrequency" NOT NULL DEFAULT 'daily',
    "status" "AgentStatus" NOT NULL DEFAULT 'active',
    "questions_created" INTEGER NOT NULL DEFAULT 0,
    "last_run" TIMESTAMP(3),
    "next_run" TIMESTAMP(3),
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sources" (
    "id" SERIAL NOT NULL,
    "agent_id" TEXT NOT NULL,
    "type" "AgentSourceType" NOT NULL,
    "config_url" TEXT,
    "config_subreddit" TEXT,
    "config_api_endpoint" TEXT,
    "config_feed_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_title" VARCHAR(1000) NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "choice" "Choice" NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0.50,
    "channel" VARCHAR(50) NOT NULL DEFAULT 'web',
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outcome_evidence" (
    "id" SERIAL NOT NULL,
    "question_id" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "evidence_type" "EvidenceType" NOT NULL DEFAULT 'text',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outcome_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_health" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "last_run" TIMESTAMP(3),
    "status" "ConnectorStatus" NOT NULL DEFAULT 'healthy',
    "items_ingested" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connector_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_stats" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "value_numeric" DECIMAL(15,2),
    "value_text" VARCHAR(500),
    "change_percentage" DECIMAL(5,2),
    "trend" "Trend" NOT NULL DEFAULT 'neutral',
    "date_recorded" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_categories" (
    "question_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "question_categories_pkey" PRIMARY KEY ("question_id","category_id")
);

-- CreateTable
CREATE TABLE "question_tags" (
    "question_id" TEXT NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("question_id","tag_id")
);

-- CreateTable
CREATE TABLE "question_sources" (
    "id" SERIAL NOT NULL,
    "question_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_risk_flags" (
    "question_id" TEXT NOT NULL,
    "risk_flag_id" INTEGER NOT NULL,

    CONSTRAINT "question_risk_flags_pkey" PRIMARY KEY ("question_id","risk_flag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "risk_flags_name_key" ON "risk_flags"("name");

-- CreateIndex
CREATE INDEX "nova_ratings_question_id_idx" ON "nova_ratings"("question_id");

-- CreateIndex
CREATE INDEX "nova_ratings_rating_idx" ON "nova_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "nova_ratings_question_id_rating_category_key" ON "nova_ratings"("question_id", "rating_category");

-- CreateIndex
CREATE UNIQUE INDEX "ai_resolution_proposals_question_id_key" ON "ai_resolution_proposals"("question_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nova_ratings" ADD CONSTRAINT "nova_ratings_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_resolution_proposals" ADD CONSTRAINT "ai_resolution_proposals_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_resolution_proposals" ADD CONSTRAINT "ai_resolution_proposals_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_sources" ADD CONSTRAINT "agent_sources_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outcome_evidence" ADD CONSTRAINT "outcome_evidence_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sources" ADD CONSTRAINT "question_sources_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_sources" ADD CONSTRAINT "question_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_risk_flags" ADD CONSTRAINT "question_risk_flags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_risk_flags" ADD CONSTRAINT "question_risk_flags_risk_flag_id_fkey" FOREIGN KEY ("risk_flag_id") REFERENCES "risk_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

