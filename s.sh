#!/bin/bash
set -e
echo "Executing ElectrospinTEK Hetzner Production Setup..."

cd /var/www/electrospintek-erp
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y python3-pip python3-venv nginx ufw

python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r backend/requirements.txt
./venv/bin/python backend/manage.py migrate
./venv/bin/python backend/seed_db.py
./venv/bin/python backend/manage.py collectstatic --noinput

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

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "========================================================"
echo "🎉 SUCCESS! Your site is live at http://46.62.208.135/"
echo "========================================================"
