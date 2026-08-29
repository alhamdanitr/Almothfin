from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/Almothfin')
source = root / 'assets' / 'app-icon-source.png'
public = root / 'public'
public.mkdir(exist_ok=True)
img = Image.open(source).convert('RGB')
for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (1024, 'icon-1024.png')]:
    img.resize((size, size), Image.Resampling.LANCZOS).save(public / name, optimize=True)
(root / 'public' / 'manifest.webmanifest').write_text('''{
  "name": "نظام إدارة العمال - معمل هاشم الأحمدي",
  "short_name": "إدارة العمال",
  "description": "نظام إدارة العمال والصرفيات والحضور",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "dir": "rtl",
  "lang": "ar",
  "theme_color": "#172554",
  "background_color": "#f8fafc",
  "icons": [
    {"src":"/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},
    {"src":"/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}
  ]
}
''', encoding='utf-8')
print('Prepared icon assets and manifest')
