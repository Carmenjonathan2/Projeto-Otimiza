import os
from PIL import Image

img_path = "C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/vaccine_vial_icon_1779372511123.png"
img = Image.open(img_path).convert("RGBA")

dark_pixels = []
for y in range(700, 770):
    for x in range(410, 590):
        r, g, b, a = img.getpixel((x, y))
        # Text is dark grey/black
        if r < 160 and g < 160 and b < 160:
            dark_pixels.append((x, y))

if dark_pixels:
    xs = [p[0] for p in dark_pixels]
    ys = [p[1] for p in dark_pixels]
    print(f"Dark pixels count: {len(dark_pixels)}")
    print(f"X bounds: min={min(xs)}, max={max(xs)}")
    print(f"Y bounds: min={min(ys)}, max={max(ys)}")
else:
    print("No dark pixels found.")
