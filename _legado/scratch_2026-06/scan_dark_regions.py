import os
from PIL import Image

orig_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\fiv_felv_box_1780928561868.png"
img = Image.open(orig_path).convert("RGBA")
width, height = img.size

# The box face is in the center. Let's scan from x=350 to x=674 (center column)
# We look for pixels that are significantly darker than the white box background (e.g. R < 180, G < 180, B < 180)
dark_rows = []
for y in range(height):
    dark_count = 0
    for x in range(350, 674):
        r, g, b, a = img.getpixel((x, y))
        # Text is typically dark purple/gold or grey/black
        if r < 200 and g < 200 and b < 200:
            dark_count += 1
    if dark_count > 2: # At least a few dark pixels in the row
        dark_rows.append((y, dark_count))

# Group consecutive dark rows into text blocks
text_blocks = []
if dark_rows:
    start_y = dark_rows[0][0]
    prev_y = start_y
    for y, count in dark_rows[1:]:
        if y - prev_y > 8: # Gap of more than 8 pixels between text lines
            text_blocks.append((start_y, prev_y))
            start_y = y
        prev_y = y
    text_blocks.append((start_y, prev_y))

print("Vertical text segments found:")
for idx, (s_y, e_y) in enumerate(text_blocks):
    # Determine the horizontal span for this block
    min_x, max_x = width, 0
    for y in range(s_y, e_y + 1):
        for x in range(200, 824): # wider search horizontally
            r, g, b, a = img.getpixel((x, y))
            if r < 200 and g < 200 and b < 200:
                if x < min_x: min_x = x
                if x > max_x: max_x = x
    print(f"Segment {idx+1}: y=[{s_y}, {e_y}], x=[{min_x}, {max_x}]")
