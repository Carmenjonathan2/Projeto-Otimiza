
import os
from image_creator import ImageCreator

def test_ai_image():
    creator = ImageCreator()
    if not creator.use_ai:
        print("AI not configured. Skipping AI test.")
        return
        
    path = "test_ai_overlay.png"
    # Ensure we use a category that has a specific template
    creator.create_pin_image(
        "Como escovar os dentes do seu gato", 
        "Higiene bucal felina essencial", 
        path, 
        "Higiene"
    )
    
    if os.path.exists(path):
        print(f"Success! Image size: {os.path.getsize(path)} bytes")
    else:
        print("Failed to create image.")

if __name__ == "__main__":
    test_ai_image()
