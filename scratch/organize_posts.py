import os
import shutil

base_dir = r"c:\Users\jonat\OneDrive\Desktop\Otimiza\vitrine-virtual"
prontos_dir = os.path.join(base_dir, "posts_prontos")

# Create directories
dia1_dir = os.path.join(prontos_dir, "Dia 1 - Terça (02-06)")
dia2_dir = os.path.join(prontos_dir, "Dia 2 - Quarta (03-06)")

os.makedirs(dia1_dir, exist_ok=True)
os.makedirs(dia2_dir, exist_ok=True)

# List of product images
product_files = [
    "post_10169929269536.png",
    "post_10169929302304.png",
    "post_10169929335072.png",
    "post_10169929400608.png",
    "post_10169929433376.png",
    "post_10169929531680.png",
    "post_10169929564448.png",
    "post_10169929629984.png"
]

# List of vaccine images
vaccine_files = {
    "post_vacinas.png": "05 - Resumo Vacinas.png",
    "post_vacina_nobivac.png": "06 - Vacina Nobivac.png",
    "post_vacina_antirrabica.png": "07 - Vacina Antirrabica.png",
    "post_vacina_gripe.png": "08 - Vacina Gripe.png",
    "post_vacina_recombitek.png": "09 - Vacina Recombitek.png"
}

# Organize Dia 1 - Terça (02-06)
# First 4 product flyers
for i in range(4):
    src = os.path.join(prontos_dir, product_files[i])
    if os.path.exists(src):
        dst = os.path.join(dia1_dir, f"0{i+1} - Promo {i+1}.png")
        shutil.copy2(src, dst)
        print(f"Copied {product_files[i]} to {dst}")

# Vaccine flyers for Dia 1
for v_file, v_name in vaccine_files.items():
    src = os.path.join(prontos_dir, v_file)
    if os.path.exists(src):
        dst = os.path.join(dia1_dir, v_name)
        shutil.copy2(src, dst)
        print(f"Copied {v_file} to {dst}")

# Organize Dia 2 - Quarta (03-06)
# Next 4 product flyers
for i in range(4, 8):
    src = os.path.join(prontos_dir, product_files[i])
    if os.path.exists(src):
        dst = os.path.join(dia2_dir, f"0{i-3} - Promo {i-3}.png")
        shutil.copy2(src, dst)
        print(f"Copied {product_files[i]} to {dst}")

print("✅ Organization completed successfully!")
