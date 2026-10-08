import os

def fix_file(path):
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Just remove any replacement chars  and unclosed quotes
    content = content.replace("|| '?\"'", "|| '-'")
    content = content.replace("|| '?\"'", "|| '-'")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('src/portals/admin/pages/Attendance/Attendance.tsx')

