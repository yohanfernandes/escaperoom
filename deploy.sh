#!/usr/bin/env bash
set -e

SSH="/c/Windows/System32/OpenSSH/ssh.exe"
KEY="/c/Users/Yohan/.ssh/id_ed25519"
HOST="root@46.224.157.82"

echo "==> Deploying escaperoom..."

$SSH -i "$KEY" -o StrictHostKeyChecking=no $HOST \
  "cd /var/www/escaperoom && git pull origin master && npm install && npm run build && pm2 restart escaperoom && echo '==> Done!'"

echo "==> Live at http://46.224.157.82"
