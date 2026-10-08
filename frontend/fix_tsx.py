import os

def fix_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        with open(path, 'r', encoding='cp1252', errors='ignore') as f:
            content = f.read()

    # Fix LeaveManagement missing fragments
    if 'LeaveManagement.tsx' in path:
        if 'return (\n    <PageContainer' in content:
            content = content.replace('return (\n    <PageContainer', 'return (\n    <>\n    <PageContainer')
            content = content.replace('      )}\n    </div>\n  );\n}\nexport default LeaveManagement;', '      )}\n    </>\n  );\n}\nexport default LeaveManagement;')

    # Fix Timesheets missing fragments
    if 'Timesheets.tsx' in path:
        if 'return (\n    <PageContainer' in content:
            content = content.replace('return (\n    <PageContainer', 'return (\n    <>\n    <PageContainer')
            content = content.replace('      )}\n    </div>\n  );\n}\nexport default Timesheets;', '      )}\n    </>\n  );\n}\nexport default Timesheets;')

    # Fix Attendance.tsx unicode corruption
    if 'Attendance.tsx' in path:
        content = content.replace('?"', '-')
        content = content.replace('?', '-')
        # Catch any weird characters around "Checked out at"
        content = content.replace('Checked out at', 'Checked out at')
        content = content.replace("|| '?'", "|| '-'")
        content = content.replace("|| '?'", "|| '-'")
        
        # Another common thing is an unclosed string if it got corrupted.
        # Let's inspect the exact lines if we need to.

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('src/portals/admin/pages/LeaveManagement/LeaveManagement.tsx')
fix_file('src/portals/admin/pages/Timesheets/Timesheets.tsx')
fix_file('src/portals/admin/pages/Attendance/Attendance.tsx')

