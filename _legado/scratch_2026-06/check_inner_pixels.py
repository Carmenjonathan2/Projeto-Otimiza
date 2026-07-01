import os
from PIL import Image

orig_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\fiv_felv_box_1780928561868.png"
img = Image.open(orig_path).convert("RGBA")

# Let's check some points inside the box face but just outside the text bounds
# Segment 3 (y=480, x spans 306 to 736)
print("Segment 3 inner left (x=310, y=480):", img.getpixel((310, 480)))
print("Segment 3 inner right (x=720, y=480):", img.getpixel((720, 480)))

# Segment 6 (y=840, x spans 559 to 769 - wait, Segment 6 spans 559 to 769 horizontally?)
# Let's check what color is at x=400, y=840 (the left part of the box at that height)
print("Segment 6 center (x=450, y=840):", img.getpixel((450, 840)))
print("Segment 6 right (x=730, y=840):", img.getpixel((730, 840)))

# Segment 7 (y=890, x spans 287 to 766)
print("Segment 7 left (x=310, y=890):", img.getpixel((310, 890)))
print("Segment 7 right (x=720, y=890):", img.getpixel((720, 890)))
