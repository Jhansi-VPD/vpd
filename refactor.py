import os
import re

root_dir = r'c:\Users\win10\Desktop\Manu\VPD_\vpd\frontend\src\portals\admin\pages'

pages = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith('.tsx') and 'index' not in filename:
            pages.append(os.path.join(dirpath, filename))

header_pattern = re.compile(
    r'<div className="space-y-[^"]*">\s*<div(?: className="flex items-center justify-between[^"]*")?>\s*(?:<div>)?\s*<h[12][^>]*>(.*?)</h[12]>\s*(?:<p[^>]*>(.*?)</p>\s*)?(?:</div>)?\s*(?:(<Button.*?</Button>))?\s*</div>',
    re.DOTALL
)

for path in pages:
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    original_code = code

    # Add imports
    if 'PageContainer' not in code:
        code = re.sub(r'import Button from.*?\n', 
                     'import Button from \'../../../../shared/components/Button\';\nimport PageContainer from \'../../../../shared/components/PageContainer\';\nimport PageHeader from \'../../../../shared/components/PageHeader\';\n', 
                     code)

    def replace_header(m):
        title = m.group(1).strip()
        desc = m.group(2).strip() if m.group(2) else ''
        actions = m.group(3).strip() if m.group(3) else ''
        
        # Indent actions
        if actions:
            actions_str = f'actions={{\n          {actions}\n        }}'
        else:
            actions_str = ''
            
        return f'<PageContainer>\n      <PageHeader\n        title="{title}"\n        description="{desc}"\n        breadcrumbs={{[{{ label: \'Admin\' }}, {{ label: \'{title}\' }}]}}\n        {actions_str}\n      />'

    if header_pattern.search(code):
        code = header_pattern.sub(replace_header, code)
        # Replace the last </div> with </PageContainer> (usually just before `);`)
        
        # Find the last </div> before the end of return statement
        last_div_index = code.rfind('</div>\n  );\n}')
        if last_div_index != -1:
            code = code[:last_div_index] + '</PageContainer>\n  );\n}'
        else:
            # Try alternate matching
            last_div_index = code.rfind('</div>\n  );')
            if last_div_index != -1:
                code = code[:last_div_index] + '</PageContainer>\n  );'
                
        if code != original_code:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(code)
            print(f'Successfully refactored {os.path.basename(path)}')
    else:
        print(f'Pattern not found in {os.path.basename(path)}')
