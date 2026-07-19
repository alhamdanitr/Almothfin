import urllib.request
import re
import json

url = "https://script.google.com/macros/s/AKfycbwWkIwLCFG0cqNzOWzgmDb7qgpmURcoVyJNUbj1lXRR7LuLBTtf8hstrA0pA70XdlcC/exec"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    # Find the initData setup
    match = re.search(r'function initData\(\) {.*?return (\[.*?\]);\s*}', html, re.DOTALL)
    if not match:
        match = re.search(r'window\.name\s*=\s*JSON\.stringify\((\{.*?\})\);', html, re.DOTALL)
        if not match:
            match = re.search(r'setHtml\((.*?)\);', html, re.DOTALL)
            
            if match:
                print("Found setHtml!")
                args = match.group(1).split(', "')
                print(args[0][:500])
    
    # Actually, apps script uses a known format. Let's just print the raw html to see its structure
    with open('output.html', 'w', encoding='utf-8') as f:
        f.write(html)
except Exception as e:
    print(e)
