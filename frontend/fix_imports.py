import os, re

def fix_imports(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    normalized_path = path.replace('\\', '/')
    parts = normalized_path.split('/')
    depth = len(parts)

    # layout.tsx -> depth 4 (src/app/admin/layout.tsx)
    if path.endswith('layout.tsx'):
        content = re.sub(r'import\s+(\w+)\s+from\s+[\'"]\.\./\.\./\.\./(portals/.*?)[\'"];?', r'import \1 from "../../\2";', content)
        
    # page.tsx -> depth 4 (src/app/admin/page.tsx)
    elif path.endswith('page.tsx') and depth == 4:
        content = re.sub(r'import\s+(\w+)\s+from\s+[\'"]\.\./\.\./\.\./(portals|screens)/(.*?)[\'"];?', r'import \1 from "../../\2/\3";', content)
        
    # page.tsx -> depth 5 (src/app/admin/users/page.tsx)
    elif path.endswith('page.tsx') and depth == 5:
        content = re.sub(r'import\s+(\w+)\s+from\s+[\'"]\.\./\.\./\.\./\.\./(portals|screens|auth)/(.*?)[\'"];?', r'import \1 from "../../../\2/\3";', content)

    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {path}")

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith(('.tsx', '.jsx')):
            fix_imports(os.path.join(root, file))

