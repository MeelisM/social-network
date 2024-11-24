-- Create new table with updated check constraint
CREATE TABLE notifications_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT CHECK(
        type IN (
            'follow_request',
            'group_invite',
            'group_join_request',
            'group_event',
            'private_message',
            'group_message'
        )
    ) NOT NULL,
    content TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Copy data from old table
INSERT INTO notifications_new
SELECT *
FROM notifications;
-- Drop old table
DROP TABLE notifications;
-- Rename new table
ALTER TABLE notifications_new
    RENAME TO notifications;
-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);