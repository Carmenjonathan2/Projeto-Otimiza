import requests
import json
import os
import time
import config

class PinterestClient:
    def __init__(self):
        self.access_token = config.PINTEREST_ACCESS_TOKEN
        self.api_url = config.PINTEREST_API_URL
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def get_user_account(self):
        """Verifies authentication by getting user info."""
        url = f"{self.api_url}/user_account"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error getting user account: {response.text}")
            return None

    def get_boards(self):
        """Lists user's boards."""
        url = f"{self.api_url}/boards"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json().get('items', [])
        else:
            print(f"Error getting boards: {response.text}")
            return []

    def create_board(self, name, description=""):
        """Creates a new board."""
        url = f"{self.api_url}/boards"
        payload = {
            "name": name,
            "description": description,
            "privacy": "PUBLIC"
        }
        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 201:
            return response.json()
        else:
            print(f"Error creating board: {response.text}")
            return None

    def upload_media(self, image_path):
        """Uploads an image to Pinterest and returns the media ID."""
        # 1. Register Upload
        register_url = f"{self.api_url}/media"
        register_payload = {
            "media_type": "IMAGE"
        }
        response = requests.post(register_url, headers=self.headers, json=register_payload)
        if response.status_code != 201:
            print(f"Error registering media: {response.text}")
            return None
        
        data = response.json()
        media_id = data['media_id']
        upload_url = data['upload_url']
        upload_parameters = data['upload_parameters']

        # 2. Upload Image
        with open(image_path, 'rb') as img_file:
            # Construct the multipart form data exactly as required
            files = {'file': img_file}
            # The upload_parameters must be passed as form fields
            upload_response = requests.post(upload_url, data=upload_parameters, files=files)
        
        if upload_response.status_code != 204:
            print(f"Error uploading image file: {upload_response.status_code} - {upload_response.text}")
            return None

        # 3. Check Status (Wait for processing)
        status_url = f"{self.api_url}/media/{media_id}"
        max_retries = 10
        for _ in range(max_retries):
            status_response = requests.get(status_url, headers=self.headers)
            if status_response.status_code == 200:
                status_data = status_response.json()
                if status_data['status'] == 'succeeded':
                    return media_id
                elif status_data['status'] == 'failed':
                    print("Media processing failed")
                    return None
            time.sleep(2)
            
        print("Media upload timed out")
        return None

    def create_pin(self, title, description, media_id, board_id, link=None):
        """Creates a pin using an uploaded media ID."""
        url = f"{self.api_url}/pins"
        payload = {
            "title": title,
            "description": description,
            "board_id": board_id,
            "media_source": {
                "source_type": "image_id",
                "cover_image_id": media_id,
                "media_id": media_id
            }
        }
        if link:
            payload["link"] = link

        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 201:
            return response.json()
        else:
            print(f"Error creating pin: {response.text}")
            return None

if __name__ == "__main__":
    # Test the client
    client = PinterestClient()
    user = client.get_user_account()
    print(f"User: {user}")
