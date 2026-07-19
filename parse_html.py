import re

with open('output.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Try to find anything looking like arabic or html content
arabic_chars = re.findall(r'[\u0600-\u06FF\s]+', text)
for c in arabic_chars:
    if len(c.strip()) > 5:
        print(c.strip())

