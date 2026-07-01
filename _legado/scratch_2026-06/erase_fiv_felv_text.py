import os
from PIL import Image

orig_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\fiv_felv_box_1780928561868.png"
dest_path = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\vitrine-virtual\fiv_felv_box.png"
artifact_dir = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c"

img = Image.open(orig_path).convert("RGBA")

# Segments to erase (start_y, end_y, start_x, end_x)
# We add a small margin of pixels to make sure we erase any anti-aliased borders of the text
erase_segments = [
    # Segment 1: pethealth
    (218, 246, 298, 735),
    # Segment 3: combinação para gatos
    (465, 499, 302, 742),
    # Segment 4: other minor text
    (511, 537, 348, 742),
    # Segment 6: resultado em 10 min
    (818, 865, 550, 775),
    # Segment 7: contem 1 un
    (874, 908, 280, 772)
]

for s_y, e_y, s_x, e_x in erase_segments:
    for y in range(s_y, e_y + 1):
        # Sample colors just outside the boundaries of the text box
        c_left = img.getpixel((s_x - 3, y))
        c_right = img.getpixel((e_x + 3, y))
        
        # Linearly interpolate color across the row
        for x in range(s_x, e_x + 1):
            t = (x - s_x) / (e_x - s_x)
            r = int(c_left[0] + (c_right[0] - c_left[0]) * t)
            g = int(c_left[1] + (c_right[1] - c_left[1]) * t)
            b = int(c_left[2] + (c_right[2] - c_left[2]) * t)
            a = int(c_left[3] + (c_right[3] - c_left[3]) * t)
            img.putpixel((x, y), (r, g, b, a))

# Save the clean box image
img.save(dest_path)
print("Erase of text from fiv_felv_box.png completed.")

# Also save a copy in artifacts for preview
img.save(os.path.join(artifact_dir, "fiv_felv_box_edited.png"))
