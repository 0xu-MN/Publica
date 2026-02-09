// 🏢 JOB CATEGORIES HIERARCHY
// Shared constant used by ProfileSetupScreen and ProfileEditPage to ensure UI consistency.

export const JOB_CATEGORIES: Record<string, string[]> = {
    'Economy': ['Macroeconomics', 'Stock Market', 'Venture Capital', 'Real Estate', 'Crypto/Blockchain'],
    'Science': ['Biotechnology', 'Physics', 'Chemistry', 'AI/Computer Science', 'Environmental Science'],
    'Art & Design': ['Graphic Design', 'UI/UX', 'Fine Arts', 'Media Arts'],
    'Business': ['Marketing', 'Strategy', 'Sales', 'HR', 'Management'],
    'Other': ['General', 'Student', 'Freelancer']
};

export const INDUSTRY_CATEGORIES = Object.keys(JOB_CATEGORIES);
