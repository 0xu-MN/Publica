const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    'https://ltoqdapmhyxwosxbpaip.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzc1NzYxMCwiZXhwIjoyMDgzMzMzNjEwfQ.2rwR4sWSg8ikynxhc5LP_4l3bn33aY5ckyMBqP3IPwc'
);

const usersToDelete = [
    '6657516b-50c5-4aec-8bc3-377ca99af9c4', // fortisfortuna068@gmail.com
    '6f4043b5-8ae0-496e-8d9d-3927896b9d9f'  // hong56800@gmail.com
];

const tablesWithUserId = ['workspace_sessions', 'scraps', 'subscriptions', 'projects'];

async function deleteData() {
    for (const id of usersToDelete) {
        console.log(`\n=== Cleaning up data for user ${id} ===`);

        for (const table of tablesWithUserId) {
            const { error } = await supabase.from(table).delete().eq('user_id', id);
            if (error) console.error(`Error deleting ${table}:`, error);
            else console.log(`Cleared ${table}`);
        }

        const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
        if (profileError) console.error(`Error deleting profile:`, profileError);
        else console.log(`Cleared profiles`);

        // Delete user from auth
        const { data, error } = await supabase.auth.admin.deleteUser(id);
        if (error) {
            console.error(`Failed to delete user auth record:`, error);
        } else {
            console.log(`Successfully deleted user from auth.users: ${id}`);
        }
    }
}

deleteData();
