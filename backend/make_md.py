import json
import os

json_path = r'c:\Users\win10\Desktop\Manu\VPD_\vpd\backend\routes_dump.json'
with open(json_path, 'r', encoding='utf-8') as f:
    routes = json.load(f)

md_content = '# Backend APIs\n\n| S.No | API | Module | What it does |\n|---|---|---|---|\n'
for idx, route in enumerate(routes, 1):
    api = f"{route['method']} {route['path']}"
    md_content += f"| {idx} | `{api}` | {route.get('module', '')} | {route.get('summary', '')} |\n"

artifact_dir = r'C:\Users\win10\.gemini\antigravity\brain\915b05fe-0739-435c-8c04-79cffb231ae6'
output_path = os.path.join(artifact_dir, 'Backend_APIs.md')

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(md_content)

print('Markdown file created successfully at', output_path)

