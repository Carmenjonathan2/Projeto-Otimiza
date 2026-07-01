import os
from PIL import Image

img_path = "C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/vaccine_vial_icon_1779372511123.png"
img = Image.open(img_path).convert("RGBA")

print("Left side samples (x=420):")
for y in range(700, 780, 5):
    print(f"y={y}: {img.getpixel((420, y))}")

print("\nRight side samples (x=580):")
for y in range(700, 780, 5):
    print(f"y={y}: {img.getpixel((580, y))}")
