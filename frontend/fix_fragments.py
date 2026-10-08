import os
import re

def fix_fragments(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # We want to replace the FIRST occurrence of:
    # return (
    #   <PageContainer ...>
    # with:
    # return (
    #   <>
    #     <PageContainer ...>
    content = content.replace("return (\n    <PageContainer", "return (\n    <>\n      <PageContainer", 1)
    
    # And replace the LAST occurrence of:
    #     </div>
    #   );
    # }
    # with:
    #     </>
    #   );
    # }
    if "</div>\n  );\n}" in content:
        # replace from the right
        parts = content.rsplit("</div>\n  );\n}", 1)
        if len(parts) == 2:
            content = parts[0] + "</>\n  );\n}" + parts[1]

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_fragments('src/portals/admin/pages/LeaveManagement/LeaveManagement.tsx')
fix_fragments('src/portals/admin/pages/Timesheets/Timesheets.tsx')


