from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/Almothfin')
source = Image.open(root / 'assets' / 'app-icon-source.png').convert('RGBA')
# Keep a safe margin for Android launcher masks.
source = source.resize((432, 432), Image.Resampling.LANCZOS)
for folder, size in [('mipmap-mdpi',48),('mipmap-hdpi',72),('mipmap-xhdpi',96),('mipmap-xxhdpi',144),('mipmap-xxxhdpi',192)]:
    out = root / 'android' / 'app' / 'src' / 'main' / 'res' / folder
    out.mkdir(parents=True, exist_ok=True)
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(out / 'ic_launcher.png', optimize=True)
    icon.save(out / 'ic_launcher_round.png', optimize=True)
print('Native Android icons prepared')
