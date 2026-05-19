# NiftyMind — OCI Deployment Guide

## Step 1: Create OCI Instance

In OCI Console → Compute → Instances → Create Instance:

| Setting | Value |
|---------|-------|
| Name | `niftymind-server` |
| Shape | `VM.Standard.A1.Flex` (Ampere ARM) |
| OCPUs | 4 |
| RAM | 24 GB |
| OS | Ubuntu 22.04 |
| Boot Volume | 200 GB |

### Networking
- Create or select a VCN with public subnet
- Assign a public IP
- Add ingress rules in the Security List:

| Port | Protocol | Source |
|------|----------|--------|
| 22 | TCP | 0.0.0.0/0 (SSH) |
| 80 | TCP | 0.0.0.0/0 (HTTP) |
| 443 | TCP | 0.0.0.0/0 (HTTPS) |

### SSH Key
- Upload your public SSH key or generate one

---

## Step 2: SSH Into Instance

```bash
ssh -i ~/.ssh/your_key ubuntu@<OCI_PUBLIC_IP>
```

---

## Step 3: Run Setup Script

```bash
# Upload and run setup
scp -i ~/.ssh/your_key deploy/setup.sh ubuntu@<OCI_PUBLIC_IP>:~/setup.sh
ssh -i ~/.ssh/your_key ubuntu@<OCI_PUBLIC_IP>
chmod +x setup.sh && sudo ./setup.sh
```

This installs: Node.js 20, PostgreSQL 16, Nginx, PM2, UFW firewall.

---

## Step 4: Upload Project Code

From your local machine:

```bash
# Exclude node_modules and .next (will be rebuilt on server)
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.env' \
  /Users/vrajalpeshkumarmodi/Desktop/Stocks/niftymind/ \
  ubuntu@<OCI_PUBLIC_IP>:/opt/niftymind/
```

---

## Step 5: Configure Environment

SSH into the server and create the env file:

```bash
sudo -u niftymind nano /opt/niftymind/.env
```

```env
# Database
DATABASE_URL=postgresql://niftymind:niftymind_secure_pw_change_me@localhost:5432/niftymind

# Auth
NEXTAUTH_SECRET=run-openssl-rand-base64-32-here

# AI
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your-secret-key-from-cloudflare

# Upstox
UPSTOX_REDIRECT_URI=http://<OCI_PUBLIC_IP>/api/auth/upstox/callback
```

Generate a secret:
```bash
openssl rand -base64 32
```

---

## Step 6: Deploy

```bash
sudo -u niftymind niftymind-deploy
```

This will:
1. `npm ci` — install dependencies
2. `prisma generate` — generate client
3. `prisma db push` — create tables
4. `npm run build` — build Next.js
5. `pm2 restart` — start/reload the app

---

## Step 7: Verify

```bash
# Check app status
pm2 status

# Check logs
pm2 logs niftymind

# Test locally
curl http://localhost:3000
```

Visit `http://<OCI_PUBLIC_IP>` in your browser.

---

## Step 8: Add Domain + SSL (Optional)

1. Point your domain's A record to the OCI public IP
2. Update Nginx config:

```bash
sudo sed -i 's/server_name _;/server_name yourdomain.com;/' /etc/nginx/sites-available/niftymind
sudo nginx -t && sudo systemctl reload nginx
```

3. Get SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com
```

4. Update `.env`:
```
UPSTOX_REDIRECT_URI=https://yourdomain.com/api/auth/upstox/callback
```

5. Redeploy: `sudo -u niftymind niftymind-deploy`

---

## Step 9: Cloudflare Turnstile Setup

After deployment, go to [Cloudflare Turnstile Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile):

1. Add your hostname: `<OCI_PUBLIC_IP>` or `yourdomain.com`
2. Copy the **Secret Key** → paste into `.env` as `TURNSTILE_SECRET_KEY`
3. The site key is already hardcoded in the app

---

## Useful Commands

```bash
# Restart app
pm2 restart niftymind

# View logs
pm2 logs niftymind --lines 50

# Monitor resources
pm2 monit

# Redeploy after code changes
sudo -u niftymind niftymind-deploy

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -d niftymind -c "SELECT count(*) FROM users;"
```

---

## Architecture

```
Internet → Cloudflare Turnstile (bot protection)
         → OCI Public IP
         → Nginx (reverse proxy, gzip, headers)
         → PM2 (2x cluster instances)
         → Next.js (port 3000)
         → PostgreSQL 16 (local)
```
