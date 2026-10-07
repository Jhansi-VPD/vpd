import os

root_dir = r'c:\Users\win10\Desktop\Manu\VPD_\vpd\frontend\src\portals\admin\pages'
for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith('.tsx'):
            path = os.path.join(dirpath, filename)
            with open(path, 'r', encoding='utf-8') as f:
                code = f.read()
            if '<PageContainer>' in code and 'import PageContainer' not in code:
                # Add import at top
                imports = "import PageContainer from '../../../../shared/components/PageContainer';\nimport PageHeader from '../../../../shared/components/PageHeader';\n"
                
                # Check depth
                depth = dirpath.count(os.sep) - root_dir.count(os.sep)
                if depth == 0:
                    imports = "import PageContainer from '../../../shared/components/PageContainer';\nimport PageHeader from '../../../shared/components/PageHeader';\n"
                else:
                    imports = "import PageContainer from '../../../../shared/components/PageContainer';\nimport PageHeader from '../../../../shared/components/PageHeader';\n"

                code = imports + code
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(code)
                print(f'Added imports to {filename}')
