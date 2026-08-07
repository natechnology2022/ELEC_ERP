import re
from collections import Counter

for filename in ['app.js', 'frontend/app.js']:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', content)
    counts = Counter(funcs)
    dupes = {k: v for k, v in counts.items() if v > 1}
    print(f"Duplicates in {filename}:", dupes)
