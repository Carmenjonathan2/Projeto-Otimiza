import os
from PIL import Image

orig_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\fiv_felv_box_1780928561868.png"
artifact_dir = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c"

img = Image.open(orig_path).convert("RGBA")
width, height = img.size

# Segments from output
segments = [
    (219, 245, 302, 730),
    (323, 457, 302, 739),
    (466, 498, 306, 736),
    (512, 536, 353, 737),
    (570, 778, 358, 768),
    (819, 864, 559, 769),
    (875, 907, 287, 766)
]

for idx, (s_y, e_y, s_x, e_x) in enumerate(segments):
    # crop with some margin
    margin = 5
    crop_img = img.crop((max(0, s_x - margin), max(0, s_y - margin), min(width, e_x + margin), min(height, e_y + margin)))
    out_path = os.path.join(artifact_dir, f"segment_{idx+1}.png")
    crop_img.save(out_path)
    print(f"Saved segment {idx+1} to {out_path}")
