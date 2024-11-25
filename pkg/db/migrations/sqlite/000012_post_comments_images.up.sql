ALTER TABLE post_comments ADD COLUMN image_path TEXT;

CREATE INDEX IF NOT EXISTS idx_post_comments_image ON post_comments(image_path);