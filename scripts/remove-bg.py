# scripts/remove-bg.py
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def process_logo():
    src_path = "public/logo.png"
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    print(f"Original image size: {w}x{h}")

    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3]

    # Detect white/near-white pixels: R > 230, G > 230, B > 230
    # and low color saturation: max(RGB) - min(RGB) < 25
    r = rgb[:, :, 0]
    g = rgb[:, :, 1]
    b = rgb[:, :, 2]
    diff = np.maximum.reduce([r, g, b]) - np.minimum.reduce([r, g, b])
    is_near_white = (r > 220) & (g > 220) & (b > 220) & (diff < 30)

    # Flood fill from boundaries
    mask = np.zeros((h, w), dtype=bool)
    queue = deque()

    # Add all border pixels that are near white
    for x in range(w):
        if is_near_white[0, x]:
            queue.append((0, x))
            mask[0, x] = True
        if is_near_white[h-1, x]:
            queue.append((h-1, x))
            mask[h-1, x] = True
    for y in range(h):
        if is_near_white[y, 0] and not mask[y, 0]:
            queue.append((y, 0))
            mask[y, 0] = True
        if is_near_white[y, w-1] and not mask[y, w-1]:
            queue.append((y, w-1))
            mask[y, w-1] = True

    # 4-connectivity BFS
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not mask[ny, nx] and is_near_white[ny, nx]:
                    mask[ny, nx] = True
                    queue.append((ny, nx))

    print(f"Outer background pixels identified: {np.sum(mask)} ({np.sum(mask)/(w*h)*100:.1f}%)")

    # Calculate alpha based on mask and edge antialiasing
    # Start with full opacity
    alpha = np.ones((h, w), dtype=np.uint8) * 255
    # Completely transparent where outer background
    alpha[mask] = 0

    # Smooth the boundary between mask and non-mask to prevent white halos
    alpha_img = Image.fromarray(alpha, mode='L')
    # Slight blur on mask boundary
    alpha_blurred = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.8))
    alpha_final = np.array(alpha_blurred)

    # Set background area to 0
    alpha_final[mask & (r > 245) & (g > 245) & (b > 245)] = 0

    # Recombine RGBA
    out_arr = np.array(img)
    out_arr[:, :, 3] = alpha_final

    # Color de-fringing: if alpha < 255 and near white, soften white contamination
    fringe_mask = (alpha_final > 0) & (alpha_final < 250) & (r > 210) & (g > 210) & (b > 210)
    # Tint fringe towards neighboring colors or reduce intensity
    out_arr[fringe_mask, 3] = (out_arr[fringe_mask, 3] * 0.7).astype(np.uint8)

    clean_img = Image.fromarray(out_arr, mode="RGBA")

    # Autocrop transparent borders while keeping square aspect ratio
    bbox = clean_img.getbbox()
    if bbox:
        # crop to content with 4% padding
        cx1, cy1, cx2, cy2 = bbox
        bw = cx2 - cx1
        bh = cy2 - cy1
        size = max(bw, bh)
        padding = int(size * 0.04)
        target_size = size + padding * 2

        square_img = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        ox = (target_size - bw) // 2
        oy = (target_size - bh) // 2
        cropped = clean_img.crop(bbox)
        square_img.paste(cropped, (ox, oy))
        clean_img = square_img.resize((1024, 1024), Image.Resampling.LANCZOS)

    # Save high-res master transparent PNG
    clean_img.save("public/logo.png", "PNG", optimize=True)
    print("Saved public/logo.png (1024x1024, transparent background)")

    # Save multiple industry-standard favicon sizes
    sizes = {
        "public/favicon-16x16.png": 16,
        "public/favicon-32x32.png": 32,
        "public/favicon-48x48.png": 48,
        "public/apple-touch-icon.png": 180,
        "public/icon-192.png": 192,
        "public/icon-512.png": 512,
        "public/favicon.png": 32,
        "src/app/icon.png": 192,
        "src/app/apple-icon.png": 180,
    }

    for path, sz in sizes.items():
        resized = clean_img.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(path, "PNG", optimize=True)
        print(f"Saved {path} ({sz}x{sz})")

    # Create multi-resolution .ico containing 16x16, 32x32, 48x48
    ico_img16 = clean_img.resize((16, 16), Image.Resampling.LANCZOS)
    ico_img32 = clean_img.resize((32, 32), Image.Resampling.LANCZOS)
    ico_img48 = clean_img.resize((48, 48), Image.Resampling.LANCZOS)

    ico_img48.save(
        "public/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[ico_img16, ico_img32]
    )
    ico_img48.save(
        "src/app/favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[ico_img16, ico_img32]
    )
    print("Saved multi-res transparent favicon.ico")

    # Generate crisp SVG favicon
    import base64
    with open("public/favicon-48x48.png", "rb") as f:
        b64_48 = base64.b64encode(f.read()).decode("utf-8")
    with open("public/logo.png", "rb") as f:
        b64_full = base64.b64encode(f.read()).decode("utf-8")

    svg_fav = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_48}" width="48" height="48" />
</svg>'''
    with open("public/favicon.svg", "w") as f:
        f.write(svg_fav)

    svg_logo = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_full}" width="1024" height="1024" />
</svg>'''
    with open("public/logo.svg", "w") as f:
        f.write(svg_logo)

    print("Saved public/favicon.svg and public/logo.svg")

if __name__ == "__main__":
    process_logo()
