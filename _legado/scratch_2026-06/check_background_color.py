import os
from PIL import Image

orig_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\fiv_felv_box_1780928561868.png"
img = Image.open(orig_path).convert("RGBA")

# Let's check some points around the text areas
# Segment 1 is at y=230. Let's check x=250 and x=750 (outside the text block horizontally but on the box face)
print("Segment 1 bg (y=230):", img.getpixel((250, 230)), img.getpixel((750, 230)))
print("Segment 3 bg (y=480):", img.getpixel((250, 480)), img.getpixel((750, 480)))
print("Segment 6 bg (y=840):", img.getpixel((250, 840)), img.getpixel((780, 840)))
print("Segment 7 bg (y=890):", img.getpixel((250, 890)), img.getpixel((780, 890)))
