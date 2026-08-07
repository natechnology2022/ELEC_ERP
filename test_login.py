import urllib.request
import json

url = 'http://46.225.31.163/api/auth/login/'
data = json.dumps({'email': 'admin@electrospintek.com', 'password': 'admin123'}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print("STATUS CODE:", response.status)
        print("RESPONSE:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("BODY:", e.read().decode('utf-8'))
