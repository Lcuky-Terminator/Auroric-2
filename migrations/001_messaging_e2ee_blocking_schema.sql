-- ============================================================================
-- MESSAGING SYSTEM WITH END-TO-END ENCRYPTION & BLOCKING
-- Production-Ready Schema for Supabase
-- ============================================================================

-- 1. Users table extension (assumes users table exists, add columns if needed)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS public_key TEXT;
-- If users table doesn't exist, create it with:
-- CREATE TABLE users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   email TEXT UNIQUE NOT NULL,
--   username TEXT UNIQUE NOT NULL,
--   public_key TEXT,
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP DEFAULT NOW()
-- );

-- 2. MESSAGES TABLE - Stores encrypted messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,  -- Base64-encoded encrypted message
  iv TEXT NOT NULL,          -- Base64-encoded initialization vector (for AES-GCM)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT sender_recipient_different CHECK (sender_id != recipient_id),
  
  -- Indexes for fast queries
  CREATE INDEX idx_messages_recipient_created 
    ON messages(recipient_id, created_at DESC),
  CREATE INDEX idx_messages_sender_created 
    ON messages(sender_id, created_at DESC),
  CREATE INDEX idx_messages_conversation 
    ON messages((GREATEST(sender_id, recipient_id)), (LEAST(sender_id, recipient_id)))
);

-- 3. BLOCKED_USERS TABLE - Stores blocking relationships
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT blocker_blocked_different CHECK (blocker_id != blocked_id),
  CONSTRAINT unique_block_relationship UNIQUE (blocker_id, blocked_id),
  
  -- Indexes
  CREATE INDEX idx_blocked_users_blocker 
    ON blocked_users(blocker_id),
  CREATE INDEX idx_blocked_users_blocked 
    ON blocked_users(blocked_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on blocked_users table
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MESSAGES TABLE RLS POLICIES
-- ============================================================================

-- Policy 1: Users can select messages where they are sender or recipient
CREATE POLICY "Users can select their own messages"
  ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = recipient_id
  );

-- Policy 2: Prevention of messaging blocked users (CRITICAL)
-- Users cannot send a message if they have blocked the recipient
CREATE POLICY "Cannot message if you blocked the recipient"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE blocker_id = auth.uid()
      AND blocked_id = messages.recipient_id
    )
  );

-- Policy 3: Prevention of messaging users who blocked you (CRITICAL)
-- Users cannot send a message if the recipient has blocked them
CREATE POLICY "Cannot message users who blocked you"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE blocker_id = messages.recipient_id
      AND blocked_id = auth.uid()
    )
  );

-- Policy 4: Only authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 5: Users can update their own messages (if needed for edit feature)
CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Policy 6: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- ============================================================================
-- BLOCKED_USERS TABLE RLS POLICIES
-- ============================================================================

-- Policy 1: Users can view their blocking relationships
CREATE POLICY "Users can view their block list"
  ON blocked_users
  FOR SELECT
  USING (
    auth.uid() = blocker_id 
    OR auth.uid() = blocked_id
  );

-- Policy 2: Users can only block/unblock as themselves
CREATE POLICY "Users can only manage their own blocks"
  ON blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Policy 3: Users can only unblock users they blocked
CREATE POLICY "Users can only unblock users they blocked"
  ON blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get all blocked user IDs for a given user
CREATE OR REPLACE FUNCTION get_blocked_user_ids(user_id UUID)
RETURNS TABLE (blocked_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT bu.blocked_id FROM blocked_users bu
  WHERE bu.blocker_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user A is blocked by user B
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_id UUID, blocked_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocked_users.blocker_id = is_user_blocked.blocker_id
    AND blocked_users.blocked_id = is_user_blocked.blocked_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation history with encryption/blocking checks
CREATE OR REPLACE FUNCTION get_conversation(other_user_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  recipient_id UUID,
  ciphertext TEXT,
  iv TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Check if current user is blocked by the other user
  IF EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = other_user_id AND blocked_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User has blocked you';
  END IF;
  
  -- Check if current user has blocked the other user
  IF EXISTS (
    SELECT 1 FROM blocked_users
    WHERE blocker_id = auth.uid() AND blocked_id = other_user_id
  ) THEN
    RAISE EXCEPTION 'You have blocked this user';
  END IF;
  
  RETURN QUERY
  SELECT m.id, m.sender_id, m.recipient_id, m.ciphertext, m.iv, m.created_at
  FROM messages m
  WHERE (
    (m.sender_id = auth.uid() AND m.recipient_id = other_user_id)
    OR (m.sender_id = other_user_id AND m.recipient_id = auth.uid())
  )
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_timestamp
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- GRANTS (adjust based on your auth setup)
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON blocked_users TO authenticated;
GRANT EXECUTE ON FUNCTION get_blocked_user_ids TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation TO authenticated;
