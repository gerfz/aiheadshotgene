-- Create function to migrate guest data to user account
-- This transfers all generations from a guest device ID to a user account

CREATE OR REPLACE FUNCTION migrate_guest_to_user(
  p_device_id TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all generations from guest to user
  UPDATE generations
  SET 
    user_id = p_user_id,
    guest_device_id = NULL,
    updated_at = NOW()
  WHERE guest_device_id = p_device_id;
  
  -- Log the migration
  RAISE NOTICE 'Migrated guest data from device % to user %', p_device_id, p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION migrate_guest_to_user(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_guest_to_user(TEXT, UUID) TO service_role;

