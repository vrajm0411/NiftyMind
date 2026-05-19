#!/bin/bash
# ============================================================
# NiftyMind — OCI Server Setup Script
# Run this on your fresh Ubuntu 22.04 OCI instance
# Usage: chmod +x setup.sh && sudo ./setup.sh
# ============================================================

set -e

APP_USER="niftymind"
APP_DIR="/opt/niftymind"
DOMAIN=""  # Set your domain here or leave empty for IP-only access

echo "============================================="
echo "  NiftyMind — OCI Deployment Setup"
echo "============================================="

# ─── 1. System Update ───────────────────────────────────────
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# ─── 2. Install Node.js 20 LTS ─────────────────────────────
echo "[2/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

echo "Node: $(node -v) | npm: $(npm -v)"

# ─── 3. Install PostgreSQL 16 ──────────────────────────────
echo "[3/8] Installing PostgreSQL 16..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
apt update
apt install -y postgresql-16

# Create database and user
sudo -u postgres psql -c "CREATE USER niftymind WITH PASSWORD 'niftymind_secure_pw_change_me';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE niftymind OWNER niftymind;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE niftymind TO niftymind;"

echo "PostgreSQL 16 ready."

# ─── 4. Create App User & Directory ────────────────────────
echo "[4/8] Creating app user and directory..."
id -u $APP_USER &>/dev/null || useradd -m -s /bin/bash $APP_USER
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

# ─── 5. Firewall Setup ─────────────────────────────────────
echo "[5/8] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ─── 6. Nginx Configuration ────────────────────────────────
echo "[6/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/niftymind << 'NGINX'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static assets cache
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/niftymind /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# ─── 7. PM2 Ecosystem File ─────────────────────────────────
echo "[7/8] Creating PM2 ecosystem config..."
cat > $APP_DIR/ecosystem.config.js << 'PM2'
module.exports = {
  apps: [{
    name: 'niftymind',
    cwd: '/opt/niftymind',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '512M',
    error_file: '/opt/niftymind/logs/error.log',
    out_file: '/opt/niftymind/logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
PM2

mkdir -p $APP_DIR/logs
chown -R $APP_USER:$APP_USER $APP_DIR

# ─── 8. Deploy Script ──────────────────────────────────────
echo "[8/8] Creating deploy helper script..."
cat > /usr/local/bin/niftymind-deploy << 'DEPLOY'
#!/bin/bash
set -e
APP_DIR="/opt/niftymind"
cd $APP_DIR

echo "→ Installing dependencies..."
npm ci --production=false

echo "→ Generating Prisma client..."
npx prisma generate

echo "→ Running database migrations..."
npx prisma db push

echo "→ Building Next.js..."
npm run build

echo "→ Restarting PM2..."
pm2 startOrRestart ecosystem.config.js --update-env
pm2 save

echo "✓ Deployment complete!"
DEPLOY

chmod +x /usr/local/bin/niftymind-deploy

# Setup PM2 startup
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

echo ""
echo "============================================="
echo "  Setup Complete!"
echo "============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Copy your project to /opt/niftymind/"
echo "   scp -r ./* ubuntu@<YOUR_OCI_IP>:/opt/niftymind/"
echo ""
echo "2. Create /opt/niftymind/.env with:"
echo "   DATABASE_URL=postgresql://niftymind:niftymind_secure_pw_change_me@localhost:5432/niftymind"
echo "   NEXTAUTH_SECRET=<generate-a-random-secret>"
echo "   ANTHROPIC_API_KEY=<your-claude-api-key>"
echo "   TURNSTILE_SECRET_KEY=<your-cloudflare-turnstile-secret>"
echo "   UPSTOX_REDIRECT_URI=http://<YOUR_OCI_IP>/api/auth/upstox/callback"
echo ""
echo "3. Run: sudo -u niftymind niftymind-deploy"
echo ""
echo "4. (Optional) Add domain + SSL:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
