#!/usr/bin/env bash
set -euo pipefail

KEY="/c/Users/Yohan/.ssh/id_ed25519"
HOST="root@46.224.157.82"

echo "==> Deploying escaperoom..."

ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" \
  "cd /var/www/escaperoom && git pull origin master && npm install && npm run build && pm2 restart escaperoom --update-env && echo '==> Done!'"

echo "==> Live at http://46.224.157.82"
