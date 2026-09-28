import os
import argparse
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps, ImageDraw

parser = argparse.ArgumentParser(description='Generate portfolio sea-chart textures from a source image.')
parser.add_argument('source', type=Path, help='Path to the source map image')
args = parser.parse_args()
src_img_path = args.source.expanduser().resolve()
if not src_img_path.is_file():
    parser.error(f'Source image not found: {src_img_path}')
out_dir = str(Path(__file__).resolve().parents[1] / 'public' / 'ui' / 'map')
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_img_path).convert("RGB")
img = img.resize((1024, 1024), Image.Resampling.LANCZOS)

# Save day map
day_webp = os.path.join(out_dir, "map-day.webp")
day_png = os.path.join(out_dir, "map-day.png")
img.save(day_webp, "WEBP", quality=92)
img.save(day_png, "PNG")
print("Saved day map to:", day_webp)

# Create night map (deep blue/indigo tint, reduced brightness, glowing aura)
night_img = ImageEnhance.Brightness(img).enhance(0.72)
night_img = ImageEnhance.Color(night_img).enhance(0.9)
# Add deep blue tint
r, g, b = night_img.split()
r = r.point(lambda p: int(p * 0.7))
g = g.point(lambda p: int(p * 0.85))
b = b.point(lambda p: min(255, int(p * 1.15)))
night_img = Image.merge("RGB", (r, g, b))

night_webp = os.path.join(out_dir, "map-night.webp")
night_png = os.path.join(out_dir, "map-night.png")
night_img.save(night_webp, "WEBP", quality=92)
night_img.save(night_png, "PNG")
print("Saved night map to:", night_webp)

# Create Top-Down Pirate Ship Player Icon (160x160)
player_size = (160, 160)
player_img = Image.new("RGBA", player_size, (0, 0, 0, 0))
draw = ImageDraw.Draw(player_img)

cx, cy = 80, 80

# Outer glowing nautical ring / wake ripple
draw.ellipse([cx - 52, cy - 52, cx + 52, cy + 52], outline=(0, 220, 255, 120), width=3)
draw.ellipse([cx - 40, cy - 40, cx + 40, cy + 40], fill=(0, 140, 200, 35))

# Pirate Ship Hull: Pointing UP (-Y) in local coords, which rotates with heading
# Ship bow is at (80, 28), stern at (80, 130)
hull_points = [
    (80, 28),   # Bow point
    (96, 52),   # Bow starboard
    (102, 90),  # Midship starboard
    (98, 122),  # Quarter starboard
    (80, 128),  # Stern center
    (62, 122),  # Quarter port
    (58, 90),   # Midship port
    (64, 52),   # Bow port
]
draw.polygon(hull_points, fill=(138, 79, 39, 255), outline=(235, 185, 95, 255))

# Inner deck
deck_points = [
    (80, 38),
    (90, 56),
    (94, 90),
    (90, 116),
    (80, 120),
    (70, 116),
    (66, 90),
    (70, 56),
]
draw.polygon(deck_points, fill=(186, 124, 73, 255), outline=(94, 49, 19, 255))

# Masts and Black Sails (cross-spars)
# Fore sail
draw.line([(60, 58), (100, 58)], fill=(30, 30, 36, 255), width=6)
draw.line([(58, 58), (102, 58)], fill=(235, 185, 95, 255), width=1)

# Main sail (larger)
draw.line([(52, 85), (108, 85)], fill=(30, 30, 36, 255), width=8)
draw.line([(50, 85), (110, 85)], fill=(235, 185, 95, 255), width=2)
# White skull/cross indicator on main sail
draw.ellipse([(77, 82), (83, 88)], fill=(255, 255, 255, 230))

# Mizzen sail
draw.line([(64, 108), (96, 108)], fill=(30, 30, 36, 255), width=5)

# Bowsprit spear pointing forward
draw.line([(80, 28), (80, 16)], fill=(235, 185, 95, 255), width=3)

# Gold heading arrowhead at tip
draw.polygon([(80, 8), (86, 18), (74, 18)], fill=(255, 215, 0, 255), outline=(255, 255, 255, 255))

player_webp = os.path.join(out_dir, "player.webp")
player_png = os.path.join(out_dir, "player.png")
player_img.save(player_webp, "WEBP", quality=95)
player_img.save(player_png, "PNG")
print("Saved player ship icon to:", player_webp)
