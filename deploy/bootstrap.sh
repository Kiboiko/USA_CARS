#!/usr/bin/env bash
# First-time server provisioning for Pro AutoHub on a fresh Ubuntu VPS.
# Idempotent-ish: safe to re-run. Run as root ON THE SERVER:
#
#   ADMIN_PASS='choose-a-strong-pass' LE_EMAIL='you@example.com' \
#     bash bootstrap.sh
#
# Optional env vars:
#   REPO_URL   (default: https://github.com/Kiboiko/USA_CARS.git)
#   APP_DIR    (default: /var/www/pro-autohub)
#   DOMAIN     (default: pro-autohub.com)
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Kiboiko/USA_CARS.git}"
APP_DIR="${APP_DIR:-/var/www/pro-autohub}"
DOMAIN="${DOMAIN:-pro-autohub.com}"
ADMIN_PASS="${ADMIN_PASS:-}"
LE_EMAIL="${LE_EMAIL:-}"

if [ -z "$ADMIN_PASS" ]; then echo "Set ADMIN_PASS=... (admin panel password)"; exit 1; fi

echo "==> [1/8] System packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git nginx ufw

echo "==> [2/8] Node.js 22 (for built-in node:sqlite)"
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

echo "==> [3/8] Firewall (SSH + HTTP/HTTPS)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
yes | ufw enable >/dev/null 2>&1 || true

echo "==> [4/8] Code"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> [5/8] Environment (.env)"
if [ ! -f .env ]; then
  cp deploy/env.production.example .env
  JWT="$(openssl rand -hex 32)"
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT}|" .env
  sed -i "s|^ADMIN1_PASSWORD=.*|ADMIN1_PASSWORD=${ADMIN_PASS}|" .env
  sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://${DOMAIN}|" .env
  echo "   .env created (Google Sheets / Resend keys can be added later)."
else
  echo "   .env already exists — left untouched."
fi

echo "==> [6/8] Build + database"
npm ci
npm run build
npm run db:migrate
npm run import:feed   # loads the 6 cars + photos from the committed 3feed folder
npm run db:seed       # creates admin logins from .env

echo "==> [7/8] systemd service"
id -u www-data >/dev/null 2>&1 || true
chown -R www-data:www-data "$APP_DIR"
cp deploy/pro-autohub.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now pro-autohub
sleep 2
curl -fsS http://127.0.0.1:3000/api/health && echo "  <- app is up"

echo "==> [8/8] nginx + HTTPS"
cp deploy/nginx-pro-autohub.conf /etc/nginx/sites-available/pro-autohub
ln -sf /etc/nginx/sites-available/pro-autohub /etc/nginx/sites-enabled/pro-autohub
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

if ! command -v certbot >/dev/null; then apt-get install -y certbot python3-certbot-nginx; fi
if [ -n "$LE_EMAIL" ]; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$LE_EMAIL" --redirect
else
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect
fi

echo ""
echo "==> DONE. Open https://${DOMAIN}"
echo "    Admin: /admin/login  (user: admin, pass: the ADMIN_PASS you set)"
