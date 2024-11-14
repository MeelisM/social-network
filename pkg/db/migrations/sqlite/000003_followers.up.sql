CREATE TABLE IF NOT EXISTS follow_requests (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'declined')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (following_id) REFERENCES users(id),
    UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_follow_requests_follower ON follow_requests(follower_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_following ON follow_requests(following_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);