const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ltoqdapmhyxwosxbpaip.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc1NzYxMCwiZXhwIjoyMDgzMzMzNjEwfQ.2rwR4sWSg8ikynxhc5LP_4l3bn33aY5ckyMBqP3IPwc'
);

async function check() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
  } else {
    console.log("Found", users.users.length, "users.");
    users.users.forEach(u => console.log(u.email, u.id));
  }
}
check();
