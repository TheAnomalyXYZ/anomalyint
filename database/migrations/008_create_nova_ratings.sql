-- Migration: Create nova_ratings table
-- Description: Stores Nova AI ratings for questions

CREATE TABLE IF NOT EXISTS nova_ratings (
  id SERIAL PRIMARY KEY,
  question_id VARCHAR(255) NOT NULL UNIQUE,
  rating VARCHAR(1) NOT NULL CHECK (rating IN ('A', 'B', 'C', 'D', 'E', 'F')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  sparkline INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nova_ratings_question_id ON nova_ratings(question_id);
CREATE INDEX IF NOT EXISTS idx_nova_ratings_rating ON nova_ratings(rating);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nova_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nova_ratings_updated_at
  BEFORE UPDATE ON nova_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_nova_ratings_updated_at();

COMMENT ON TABLE nova_ratings IS 'Nova AI ratings for questions (A-F scale)';
COMMENT ON COLUMN nova_ratings.question_id IS 'Foreign key to questions table';
COMMENT ON COLUMN nova_ratings.rating IS 'Letter grade: A (best) to F (worst)';
COMMENT ON COLUMN nova_ratings.confidence IS 'Confidence percentage (0-100)';
COMMENT ON COLUMN nova_ratings.sparkline IS 'Array of historical confidence values for trend visualization';
