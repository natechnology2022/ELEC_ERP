#!/bin/bash
set -e
echo "========================================================"
echo "🚀 STARTING AUTOMATED ELECTROSPINTEK ERP DEPLOYMENT..."
echo "========================================================"

# 1. Inject Local SSH Public Key
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC/t91zXAi3F7906xM79nxZKJ2arpS9Ty51QEY9sqtzXzIrWaeZ65QjW1xHXqd0gI/fuiq13d6BJws9WXtTFBka455pVbvWCnlrBeI3jVogFgau3XwFDKA+OiBuPdVfQgkixpzAp9ZoLnGEZfTG2fa4XrQbR7hQEPl+IHidr0vcTRxFZO7xRXcA5kHNSTcF2ljd5ScCSTcPMORl0p7fmSNKxtP6yFOxL/IlB/myC+xED3e19IthKrogkN5JLp0dzJKu5H1G2Hjj7OUYlywjMHTFiWMZkh9OkZ7LVTZ+a0MlfPK9kF/GwOekmAT2mbobWPzEmUxyDcXnbCtPh6sR69udCC1hWL6hBkFYbcv8KhnIs3rwyxTPRKAI4qq0Vq28hPwr4wS2sBN296zdwxNVsdPpeRIflQP8zfR/Lg/GNlA6NcuwmOXBd2qveD3KVcCOLgTBIpjnaxRpO0I8ZZy6I/sGZjYPxKBkkVFqG1G16R+fz/vu1fC7wX+zDo5Oqqw+TAc7PeDMKB1cnPCbihb8YE6Z7kZzQTYVGYBW0zYmy6kSdr3fyjEu5N5ykf9Is6l11JdSaB3tWYP4KDgmALFrQeKSz6crc0ehP6/M7IC82yU9d8NyEOvydWVaYhm7J9jlV432N5g0fmozEbmD2xi1XyMJSK9U1ceR2YvLcHC0ioeiyQ== natec@Electrospintek" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 2. Update System Packages
export DEBIAN_FRONTEND=noninteractive
apt-get update && apt-get install -y python3-pip python3-venv nginx git ufw certbot python3-certbot-nginx

# 3. Clone Repository & Install Python Dependencies
cd /var/www
rm -rf electrospintek-erp
git clone https://github.com/natechnology2022/electrospintek-erp.git
cd electrospintek-erp
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r backend/requirements.txt
./venv/bin/python backend/manage.py migrate
./venv/bin/python backend/seed_db.py
./venv/bin/python backend/manage.py collectstatic --noinput

# 4. Configure Gunicorn Systemd Service
cat << 'EOF' > /etc/systemd/system/electrospintek.service
[Unit]
Description=ElectrospinTEK ERP Gunicorn Daemon
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/electrospintek-erp
ExecStart=/var/www/electrospintek-erp/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 backend.estek_erp.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now electrospintek

# 5. Configure Nginx Server Block
cat << 'EOF' > /etc/nginx/sites-available/electrospintek
server {
    listen 80;
    server_name 46.62.208.135 _ ;

    location / {
        root /var/www/electrospintek-erp;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/electrospintek-erp/backend/static/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/electrospintek /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 6. Configure UFW Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "========================================================"
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "🌐 Live Web App URL: http://46.62.208.135/"
echo "🐍 Django Admin Portal: http://46.62.208.135/admin/"
echo "========================================================"
