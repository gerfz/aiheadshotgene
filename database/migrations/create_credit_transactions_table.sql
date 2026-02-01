-- Migration: Create Credit Transactions Table
-- Description: Track all credit purchases and awards
-- Date: 2026-01-24

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL UNIQUE,
  pack_id TEXT,
  credits_added INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'trial', 'renewal', 'bonus', 'refund')),
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_transaction_id ON credit_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT ON credit_transactions TO authenticated;

-- Add comment
COMMENT ON TABLE credit_transactions IS 'Tracks all credit purchases, awards, and refunds';
