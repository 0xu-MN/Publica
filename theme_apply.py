import os
import re

files_to_patch = [
    'src/components/ConnectHomeView.tsx',
    'src/screens/ConnectScreen.tsx',
    'src/screens/FeedScreen.tsx',
    'src/components/workspace/views/WorkspaceDashboard.tsx',
    'src/components/TimelinePost.tsx'
]

replacements = {
    # Backgrounds
    r'bg-\[\#020617\]': 'bg-transparent',
    r'bg-\[\#050B14\]': 'bg-transparent',
    r'bg-\[\#0F172A\]': 'bg-white dark:bg-[#0F172A]',
    r'bg-slate-900/50': 'bg-white dark:bg-slate-900/50',
    r'bg-slate-900/80': 'bg-white dark:bg-slate-900/80',
    r'bg-slate-800/20': 'bg-slate-100 dark:bg-slate-800/20',
    r'(?<!dark:)bg-slate-800/80': 'bg-white dark:bg-slate-800/80',
    r'(?<!dark:)bg-slate-800': 'bg-slate-100 dark:bg-slate-800',
    r'(?<!dark:)bg-white/5': 'bg-slate-100 dark:bg-white/5',
    r'(?<!dark:)bg-white/10': 'bg-slate-200 dark:bg-white/10',
    
    # Texts
    r'(?<!dark:)text-white': 'text-slate-900 dark:text-white',
    r'(?<!dark:)text-slate-400': 'text-slate-500 dark:text-slate-400',
    r'(?<!dark:)text-slate-300': 'text-slate-600 dark:text-slate-300',
    r'(?<!dark:)text-slate-200': 'text-slate-700 dark:text-slate-200',
    
    # Borders
    r'(?<!dark:)border-white/10': 'border-slate-200 dark:border-white/10',
    r'(?<!dark:)border-white/5': 'border-slate-200 dark:border-white/5',
    r'(?<!dark:)border-slate-800/50': 'border-slate-200 dark:border-slate-800/50',
}

for file_path in files_to_patch:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for pattern, repl in replacements.items():
        # Using regex to replace
        content = re.sub(pattern, repl, content)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied light/dark themes!")
