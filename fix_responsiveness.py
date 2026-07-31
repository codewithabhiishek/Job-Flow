import re

files_to_fix_padding = [
    "src/pages/Dashboard.jsx",
    "src/pages/Kanban.jsx",
    "src/pages/Analytics.jsx",
    "src/pages/Settings.jsx"
]

# Fix global search array
search_pattern = r"\[j\.company, j\.job_title, j\.location\]\.some\("
search_replacement = r"[j.company, j.job_title, j.location, j.source, j.status].some("

for file in files_to_fix_padding:
    with open(file, "r") as f:
        content = f.read()
    
    # Replace search
    content = re.sub(search_pattern, search_replacement, content)
    
    # Replace padding p-6 -> p-4 md:p-6 lg:p-8
    content = re.sub(r'className="p-6\b', r'className="p-4 md:p-6 lg:p-8 ', content)
    
    with open(file, "w") as f:
        f.write(content)

print("Padding and Search fixes applied")
