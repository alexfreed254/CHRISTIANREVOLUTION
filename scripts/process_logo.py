"""Process CRM logo: remove outer white bg, clean fringe, crop, save."""
from pathlib import Path
from collections import deque
from PIL import Image, ImageFilter

src = Path(
    r"C:\Users\user\.cursor\projects\c-Users-user-Desktop-CHRIST-REVOLUTION-MOVEMENT1"
    r"\assets\c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"93ff272d648090332d0fb841af62f118_images_CHURCH_LOGO-09d83a5b-3165-4974-9bf4-e274f09afbae.png"
)
out_dir = Path(r"C:\Users\user\Desktop\CHRIST-REVOLUTION-MOVEMENT1\frontend\public")
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
w, h = img.size
pixels = img.load()

# 1) Flood-fill near-white background from edges
threshold = 235
bg = [[False] * w for _ in range(h)]


def is_bg_color(r, g, b, a):
    return a > 0 and r >= threshold and g >= threshold and b >= threshold


q = deque()
for x in range(w):
    q.append((x, 0))
    q.append((x, h - 1))
for y in range(h):
    q.append((0, y))
    q.append((w - 1, y))

seen = [[False] * w for _ in range(h)]
while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
        continue
    seen[y][x] = True
    r, g, b, a = pixels[x, y]
    if not is_bg_color(r, g, b, a):
        continue
    bg[y][x] = True
    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

# 2) Expand background mask 2px to eat anti-aliased white fringe
expanded = [row[:] for row in bg]
for _ in range(2):
    nxt = [row[:] for row in expanded]
    for y in range(h):
        for x in range(w):
            if expanded[y][x]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and expanded[ny][nx]:
                    r, g, b, a = pixels[x, y]
                    # Only eat pale fringe pixels, not purple/black logo ink
                    if r > 200 and g > 200 and b > 200:
                        nxt[y][x] = True
                    break
    expanded = nxt

# 3) Apply transparency + soften remaining pale edge pixels
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if expanded[y][x]:
            pixels[x, y] = (r, g, b, 0)
            continue
        # Knock down leftover white fringe near transparent neighbors
        if r > 220 and g > 220 and b > 220:
            near_clear = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and expanded[ny][nx]:
                    near_clear = True
                    break
            if near_clear:
                pixels[x, y] = (r, g, b, 0)

bbox = img.getbbox()
print("bbox", bbox)
if bbox:
    pad = 6
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(w, bbox[2] + pad)
    bottom = min(h, bbox[3] + pad)
    img = img.crop((left, top, right, bottom))

print("cropped", img.size)

logo_path = out_dir / "logo.png"
img.save(logo_path, "PNG", optimize=True)
print("saved", logo_path, logo_path.stat().st_size)

favicon = img.copy()
favicon.thumbnail((64, 64), Image.Resampling.LANCZOS)
favicon.save(out_dir / "favicon.png", "PNG", optimize=True)

mark = img.copy()
mark.thumbnail((512, 512), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
canvas.paste(mark, ((512 - mark.width) // 2, (512 - mark.height) // 2), mark)
canvas.save(out_dir / "logo-square.png", "PNG", optimize=True)
print("done")
