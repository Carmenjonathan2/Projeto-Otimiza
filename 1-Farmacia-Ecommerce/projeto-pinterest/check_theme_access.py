import requests
import config

SHOP_URL = config.SHOPIFY_SHOP_URL.replace("https://", "").replace("/", "")
ACCESS_TOKEN = config.SHOPIFY_ACCESS_TOKEN
API_VERSION = "2024-01"

def get_headers():
    return {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ACCESS_TOKEN
    }

def list_themes():
    url = f"https://{SHOP_URL}/admin/api/{API_VERSION}/themes.json"
    response = requests.get(url, headers=get_headers())
    
    if response.status_code == 200:
        themes = response.json().get("themes", [])
        print(f"Found {len(themes)} themes.")
        for theme in themes:
            role = theme.get('role', 'unknown')
            print(f"- ID: {theme['id']}, Name: {theme['name']}, Role: {role}")
            if role == 'main':
                return theme['id']
    else:
        print(f"Error listing themes: {response.status_code} - {response.text}")
    return None

def get_theme_liquid(theme_id):
    url = f"https://{SHOP_URL}/admin/api/{API_VERSION}/themes/{theme_id}/assets.json?asset[key]=layout/theme.liquid"
    response = requests.get(url, headers=get_headers())
    
    if response.status_code == 200:
        asset = response.json().get("asset", {})
        print("Successfully read layout/theme.liquid")
        return asset.get("value")
    else:
        print(f"Error reading asset: {response.status_code} - {response.text}")
        return None

if __name__ == "__main__":
    main_theme_id = list_themes()
    if main_theme_id:
        print(f"Main Theme ID: {main_theme_id}")
        content = get_theme_liquid(main_theme_id)
        if content:
             if "p:domain_verify" in content:
                 print("Verification tag ALREADY PRESENT.")
             else:
                 print("Verification tag NOT FOUND. Ready to inject.")
