-- Add brand_profile_id to corpora table
-- This links each knowledge corpus to a specific brand profile

ALTER TABLE corpora
ADD COLUMN brand_profile_id VARCHAR(36),
ADD CONSTRAINT fk_corpora_brand_profile
  FOREIGN KEY (brand_profile_id)
  REFERENCES brand_profiles(id)
  ON DELETE SET NULL;

-- Create index for profile filtering
CREATE INDEX idx_corpora_profile ON corpora(brand_profile_id);

-- Add comment
COMMENT ON COLUMN corpora.brand_profile_id IS 'Links corpus to a specific brand profile for isolated knowledge bases';
