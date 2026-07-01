import os
from PIL import Image
import shutil

# Paths
base_dir = "c:/Users/jonat/OneDrive/Desktop/Projeto Otimiza/vitrine-virtual"
orig_img_path = "C:/Users/jonat/.gemini/antigravity/brain/31c3a2fe-45ea-471b-bd34-d2cc41278a7c/vaccine_vial_icon_1779372511123.png"
dest_img_path = os.path.join(base_dir, "vaccine_vial_icon.png")

# Restore original image first
shutil.copyfile(orig_img_path, dest_img_path)

img = Image.open(dest_img_path).convert("RGBA")

# We want to erase the text inside x=[430, 590], y=[715, 765]
start_x, end_x = 430, 590
start_y, end_y = 715, 765

for y in range(start_y, end_y + 1):
    c_left = img.getpixel((start_x, y))
    c_right = img.getpixel((end_x, y))
    
    for x in range(start_x, end_x + 1):
        t = (x - start_x) / (end_x - start_x)
        r = int(c_left[0] + (c_right[0] - c_left[0]) * t)
        g = int(c_left[1] + (c_right[1] - c_left[1]) * t)
        b = int(c_left[2] + (c_right[2] - c_left[2]) * t)
        a = int(c_left[3] + (c_right[3] - c_left[3]) * t)
        img.putpixel((x, y), (r, g, b, a))

img.save(dest_img_path)
print("Erase completed successfully.")
