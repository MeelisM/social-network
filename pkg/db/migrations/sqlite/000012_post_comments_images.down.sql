DROP INDEX IF EXISTS idx_post_comments_image;
ALTER TABLE post_comments DROP COLUMN image_path;
