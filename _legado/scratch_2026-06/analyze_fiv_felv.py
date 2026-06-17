import os
from PIL import Image

orig_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\fiv_felv_box_1780928561868.png"

if not os.path.exists(orig_path):
    print("Error: Original image not found at", orig_path)
    sys.exit(1)

img = Image.open(orig_path).convert("RGBA")
width, height = img.size
print(f"Image dimensions: {width}x{height}")

# Let's find vertical regions with non-white pixels
# We'll check horizontal lines. If a line has many non-white pixels, it contains text/graphics.
non_white_lines = []
for y in range(height):
    count = 0
    for x in range(width):
        r, g, b, a = img.getpixel((x, y))
        # If pixel is not white/transparent (distance from white)
        if r < 245 or g < 245 or b < 245:
            count += 1
    if count > 5: # threshold of pixels in a row
        non_white_lines.append((y, count))

# Group consecutive lines containing graphics/text
groups = []
if non_white_lines:
    start_y = non_white_lines[0][0]
    prev_y = start_y
    for y, count in non_white_lines[1:]:
        if y - prev_y > 10: # Gap of 10 pixels means a new text block
            groups.append((start_y, prev_y))
            start_y = y
        prev_y = y
    groups.append((start_y, prev_y))

print("\nDetected vertical text/graphic blocks:")
for idx, (s_y, e_y) in enumerate(groups):
    # Find horizontal bounding box for this vertical block
    min_x, max_x = width, 0
    for y in range(s_y, e_y + 1):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            if r < 245 or g < 245 or b < 245:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
    print(f"Block {idx+1}: y=[{s_y}, {e_y}], x=[{min_x}, {max_x}]")
