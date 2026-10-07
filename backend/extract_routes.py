import json
from app.main import app

routes = []
for route in app.routes:
    if hasattr(route, "methods"):
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": list(route.methods),
            "tags": getattr(route, "tags", [])
        })

print(f"TOTAL_ROUTES_COUNT: {len(routes)}")
with open("extracted_routes.json", "w") as f:
    json.dump(routes, f, indent=2)
print("Saved to extracted_routes.json")

