import os
import shutil
from datetime import datetime, timedelta

base_dir = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\vitrine-virtual"
prontos_dir = os.path.join(base_dir, "posts_prontos")

# List all png files in the directory (only files directly in posts_prontos, excluding folders)
files = sorted([f for f in os.listdir(prontos_dir) if f.endswith('.png') and os.path.isfile(os.path.join(prontos_dir, f))])

print(f"Found {len(files)} files to organize.")

# Weekdays translation
weekdays_pt = {
    0: "Segunda",
    1: "Terça",
    2: "Quarta",
    3: "Quinta",
    4: "Sexta",
    5: "Sábado",
    6: "Domingo"
}

# Start date: tomorrow, June 2nd, 2026
start_date = datetime(2026, 6, 2)

files_per_day = 4
num_days = (len(files) + files_per_day - 1) // files_per_day

for day_idx in range(num_days):
    current_date = start_date + timedelta(days=day_idx)
    date_str = current_date.strftime("%d-%m")
    day_name = weekdays_pt[current_date.weekday()]
    
    # Folder name, e.g. "Dia 01 - Terça (02-06)"
    folder_name = f"Dia {day_idx + 1:02d} - {day_name} ({date_str})"
    day_folder = os.path.join(prontos_dir, folder_name)
    os.makedirs(day_folder, exist_ok=True)
    
    # Slice the files for this day
    day_files = files[day_idx * files_per_day : (day_idx + 1) * files_per_day]
    
    for file_idx, f in enumerate(day_files):
        src = os.path.join(prontos_dir, f)
        # Standardized destination name, e.g. "01 - Promo 1.png"
        dst_name = f"{file_idx + 1:02d} - Promo {file_idx + 1}.png"
        dst = os.path.join(day_folder, dst_name)
        
        # Move the file instead of copying so the root directory is clean when done
        shutil.move(src, dst)

print("Files organized successfully into daily folders!")
