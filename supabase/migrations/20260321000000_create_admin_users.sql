-- Create admin_users table for managing admin access
-- Only users whose email is in this table can access the admin panel

CREATE TABLE IF NOT EXISTS admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    display_name text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated) to read admin_users to check if they're admin
CREATE POLICY "Users can check admin status"
    ON admin_users FOR SELECT
    TO authenticated
    USING (true);

-- Insert default admin
INSERT INTO admin_users (email, display_name)
VALUES ('hong56800@gmail.com', '관리자')
ON CONFLICT (email) DO NOTHING;
