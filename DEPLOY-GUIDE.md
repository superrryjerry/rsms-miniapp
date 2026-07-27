# RSMS CRM 系统部署经验手册

> 基于首次部署经验整理，供新服务器迁移时参考。
> 编写日期：2026-07-27（含安全优化更新）

---

## 一、系统架构概览

```
用户 → HTTPS(443) → Nginx → 前端静态文件(dist/)
                    └→ /api/ 反向代理 → Node.js(127.0.0.1:3000) → SQLite
小程序 → HTTPS(443) → Nginx → /api/ → Node.js(3000) → SQLite
```

### 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| OS | Ubuntu 24.04 LTS | 推荐 |
| Node.js | v22.x | 后端运行时 |
| npm | v10.x | 包管理 |
| PM2 | v7.x | 进程守护 |
| Nginx | v1.24 | 反向代理 + 静态文件 |
| SQLite | (better-sqlite3) | 嵌入式数据库，无需单独安装 |
| Vue 3 + Element Plus | - | Web前端 |
| 微信小程序 | - | 移动端 |

### 三个代码仓库

| 仓库 | GitHub地址 | 服务器路径 |
|------|-----------|-----------|
| 后端API | `github.com/superrryjerry/rsms-backend` | `~/rsms-backend/` |
| Web前端 | `github.com/superrryjerry/rsms-admin` | `~/rsms-admin/` |
| 微信小程序 | `github.com/superrryjerry/rsms-miniapp` | 本地开发，不部署到服务器 |

---

## 二、服务器环境准备

### 2.1 系统要求

- **OS**: Ubuntu 22.04 / 24.04 LTS
- **内存**: 最低2GB（当前2GB够用，占用约30%）
- **磁盘**: 最低20GB（当前40GB，使用19%）
- **网络**: 需开放 80 和 443 端口

### 2.2 安装 fail2ban（防SSH暴力破解）

```bash
sudo apt-get install -y fail2ban

# 配置：SSH失败5次封禁10分钟
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 600
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# 验证
sudo fail2ban-client status sshd
```

> fail2ban 开箱即用，盯着系统登录日志，发现某IP连续输错SSH密码5次就自动拉进防火墙黑名单封10分钟。
> `bantime`（封禁时长）和 `maxretry`（最大失败次数）可按需调整。

### 2.3 安装 Node.js v22

```bash
# 安装 Node.js 22.x LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v   # v22.x
npm -v    # v10.x
```

### 2.4 安装 PM2（进程守护）

```bash
sudo npm install -g pm2

# 设置开机自启
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# 按提示执行返回的 sudo 命令
```

### 2.5 安装 Nginx

```bash
sudo apt-get install -y nginx
```

### 2.6 配置 Git 凭证

```bash
# 配置 GitHub 访问凭证（私有仓库）
echo "https://用户名:token@github.com" > ~/.git-credentials
git config --global credential.helper store
git config --global user.name "部署用户名"
git config --global user.email "邮箱"
```

> **注意**: 需要在 GitHub 创建 Personal Access Token (PAT)，权限选 `repo`。

---

## 三、部署后端（rsms-backend）

### 3.1 克隆代码

```bash
cd ~
git clone https://github.com/superrryjerry/rsms-backend.git
cd rsms-backend
```

### 3.2 安装依赖

```bash
npm install
```

> better-sqlite3 是原生模块，可能需要 `sudo apt-get install -y python3 build-essential`。

### 3.3 配置环境变量

创建 `.env` 文件：

```bash
cat > ~/rsms-backend/.env << 'EOF'
PORT=3000
JWT_SECRET=替换为一个强随机字符串
JWT_EXPIRES=7d
CORS_ORIGINS=https://你的域名,http://你的域名
EOF
```

**生成 JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 创建数据目录

```bash
mkdir -p ~/rsms-backend/data
mkdir -p ~/rsms-backend/uploads
```

### 3.5 初始化数据库

```bash
node src/migrations/init.js
```

> 首次启动会自动创建数据库表结构 + 默认管理员账号。
> 控制台会输出管理员密码，**务必保存**！

### 3.6 用 PM2 启动（ecosystem 模式）

项目根目录已有 `ecosystem.config.js` 配置文件，包含内存限制、崩溃重启策略、日志配置等：

```bash
cd ~/rsms-backend
pm2 start ecosystem.config.js
pm2 save
```

> **ecosystem.config.js 关键配置项**：
> - `max_memory_restart: '400M'` — 内存超400M自动重启（防内存泄漏，2G机器必选项）
> - `restart_delay: 5000` — 崩溃后等5秒再拉起，避免疯狂重启
> - `max_restarts: 10` — 1分钟内重启10次就停止（防止反复崩溃）
> - `min_uptime: '10s'` — 启动10秒内崩溃算异常
> - `log_date_format` — 日志加时间戳
>
> 以后启动只需 `pm2 start ecosystem.config.js`，不用手敲参数。

### 3.7 配置 PM2 日志轮转

防止日志把硬盘写满（日志超50MB切一刀，旧文件压缩，只保留最近7个）：

```bash
pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 50M      # 超过50MB切一刀
pm2 set pm2-logrotate:retain 7          # 只保留最近7个
pm2 set pm2-logrotate:compress true    # 旧文件压缩存档
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

pm2 save
```

### 3.8 验证后端

```bash
curl http://localhost:3000/api/health
# 应返回: {"status":"ok","time":"..."}
```

---

## 四、部署前端（rsms-admin）

### 4.1 克隆代码

```bash
cd ~
git clone https://github.com/superrryjerry/rsms-admin.git
cd rsms-admin
```

### 4.2 安装依赖

```bash
npm install
```

### 4.3 构建生产版本

```bash
npm run build
# 生成 dist/ 目录
```

### 4.4 验证

```bash
ls dist/
# 应有: index.html  assets/
```

---

## 五、配置 Nginx + SSL

### 5.1 申请 SSL 证书（Let's Encrypt）

```bash
# 安装 certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 先确保域名 DNS 已指向新服务器 IP
# 申请证书
sudo certbot --nginx -d 你的域名 -d www.你的域名
```

### 5.2 配置 Nginx

创建配置文件：

```bash
sudo tee /etc/nginx/sites-available/rsms << 'NGINX'
# ============ 安全限流配置 ============
# API限流30r/s（兜底防护，防DDoS；正常用户不会触发）
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
# 登录限流20r/m（兜底防护；防暴力破解主力是后端密码错误5次锁定30分钟）
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=20r/m;

server {
    listen 80 default_server;
    server_name 你的域名 www.你的域名;
    
    # HTTP自动跳转HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl default_server;
    server_name 你的域名 www.你的域名;
    client_max_body_size 100M;

    # ============ SSL证书 ============
    ssl_certificate /etc/letsencrypt/live/你的域名/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ============ 安全响应头 ============
    server_tokens off;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Robots-Tag "noindex, nofollow" always;

    # ============ 前端静态文件 ============
    root /home/ubuntu/rsms-admin/dist;
    index index.html;

    # ============ 禁止访问敏感文件 ============
    location ~ /\. { deny all; return 404; }
    location ~* \.(env|git|gitignore|dockerignore|md|log|bak|sql|conf)$ { deny all; return 404; }

    # ============ 前端路由(SPA) ============
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ============ 后端API代理 ============
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ============ 登录接口额外限流 ============
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# 启用配置
sudo ln -sf /etc/nginx/sites-available/rsms /etc/nginx/sites-enabled/rsms
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t          # 测试配置
sudo systemctl reload nginx
```

### 5.3 SSL 证书自动续期

```bash
# Let's Encrypt 证书有效期90天，certbot会自动添加续期定时任务
# 验证续期命令
sudo certbot renew --dry-run
```

---

## 六、小程序配置更新

小程序代码不部署到服务器，在微信开发者工具本地开发后上传。

### 6.1 修改域名配置

编辑 `app.js` 中的 `envConfig`：

```js
envConfig: {
  develop: 'http://新服务器IP/api',        // 开发环境
  trial: 'https://新域名/api',              // 体验版
  release: 'https://新域名/api'             // 正式版
}
```

### 6.2 微信公众平台配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 开发管理 → 开发设置 → 服务器域名
3. `request合法域名` 添加 `https://新域名`
4. `downloadFile合法域名` 添加 `https://新域名`（如果用到图片下载）

---

## 七、数据迁移（如需迁移现有数据）

### 7.1 备份现有数据库

```bash
# 在旧服务器上
cp ~/rsms-backend/data/rsms.db ~/rsms-backend/data/rsms.db.bak
```

### 7.2 传输到新服务器

```bash
# 从旧服务器SCP到新服务器
scp ~/rsms-backend/data/rsms.db ubuntu@新IP:~/rsms-backend/data/
```

### 7.3 迁移上传文件（如有）

```bash
scp -r ~/rsms-backend/uploads/ ubuntu@新IP:~/rsms-backend/
```

### 7.4 ⚠️ 重要：不要用 init-db 覆盖已有数据

如果数据库已迁移过来，**不要**再运行 `node src/migrations/init.js`。
init.js 中的迁移逻辑是幂等的（有则跳过），但安全起见，有数据时直接启动即可。

---

## 八、日常运维命令

### 8.1 更新代码后部署

```bash
# === 后端更新 ===
cd ~/rsms-backend
git pull origin main
npm install              # 如有新依赖
pm2 restart rsms-backend

# === 前端更新 ===
cd ~/rsms-admin
git pull origin main
npm install              # 如有新依赖
npm run build

# === 数据库备份（每次更新前）===
cp ~/rsms-backend/data/rsms.db ~/rsms-backend/data/rsms.db.bak.$(date +%Y%m%d%H%M%S)
```

### 8.2 查看日志

```bash
# 后端日志
pm2 logs rsms-backend --lines 50 --nostream

# Nginx访问日志
sudo tail -50 /var/log/nginx/access.log

# Nginx错误日志
sudo tail -50 /var/log/nginx/error.log

# fail2ban封禁状态
sudo fail2ban-client status sshd
```

### 8.3 重启服务

```bash
# 重启后端
pm2 restart rsms-backend

# 重载Nginx配置
sudo systemctl reload nginx
```

### 8.4 PM2 开机自启 + 日志轮转

```bash
pm2 save                # 保存当前进程列表
pm2 startup             # 设置开机自启（按提示执行返回的sudo命令）

# 日志轮转已安装 pm2-logrotate，配置：
# max_size 50M | retain 7 | compress true
# 如需修改：pm2 set pm2-logrotate:参数名 值
```

---

## 九、常见问题与坑

### 9.1 better-sqlite3 安装失败

```bash
# 需要编译环境
sudo apt-get install -y python3 build-essential
npm rebuild better-sqlite3
```

### 9.2 Nginx 502 Bad Gateway

```bash
# 检查后端是否在运行
pm2 list

# 检查端口是否在监听
ss -tlnp | grep 3000

# 重启后端
pm2 restart rsms-backend
```

### 9.3 express-rate-limit 报 X-Forwarded-For 警告

这是因为 Nginx 代理后 header 里有 X-Forwarded-For，但 Express 没开 trust proxy。
在 app.js 里加一行（如需要）：
```js
app.set('trust proxy', 1);
```
> 当前不影响功能，只是警告。

### 9.4 SSL证书路径

Let's Encrypt 证书路径格式：
```
/etc/letsencrypt/live/域名/fullchain.pem
/etc/letsencrypt/live/域名/privkey.pem
```
Nginx配置里要改成实际域名。

### 9.5 小程序图片访问 401

小程序 `<image>` 组件不支持自定义 HTTP Header，如果图片接口有鉴权保护：
- **方案**: 图片接口支持 `?token=xxx` URL参数鉴权
- **代码**: 后端 `app.js` 的 `/api/uploads/:filename` 路由已支持

### 9.6 数据库 WAL 文件

SQLite 使用 WAL 模式，会产生 `rsms.db-wal` 和 `rsms.db-shm` 文件。
**备份数据库时需要同时复制这三个文件**，或者先停止后端再备份。

### 9.7 后端密码错误锁定机制

后端 `auth.js` 已内置登录失败锁定：
- 同一账号连续输错密码 **5次** → 锁定 **30分钟**
- 锁定期间返回 `429: 登录失败次数过多，请X分钟后再试`
- 登录成功会自动清除失败记录
- 每小时自动清理过期的锁定记录

> 这是防暴力破解的主力措施。Nginx登录限流(20r/m)只是兜底，两者配合使用。

### 9.8 微信小程序 envVersion

```js
const env = wx.getAccountInfoSync().miniProgram.envVersion;
// develop → 开发版（微信开发者工具）
// trial   → 体验版
// release → 正式版
```
baseUrl 会自动切换，不需要手动改。

---

## 十、文件目录结构

```
/home/ubuntu/
├── rsms-backend/
│   ├── .env                    # 环境变量（不提交Git）
│   ├── .git/
│   ├── .gitignore
│   ├── package.json
│   ├── ecosystem.config.js     # PM2配置（内存限制+重启策略+日志）
│   ├── node_modules/
│   ├── src/
│   │   ├── app.js              # 后端入口
│   │   ├── config/db.js        # SQLite配置
│   │   ├── middleware/auth.js  # JWT鉴权
│   │   ├── migrations/init.js  # 数据库迁移
│   │   ├── routes/             # API路由
│   │   │   ├── auth.js
│   │   │   ├── pool.js
│   │   │   ├── vehicles.js
│   │   │   ├── customers.js
│   │   │   ├── dashboard.js
│   │   │   ├── leads.js
│   │   │   ├── activities.js
│   │   │   ├── contracts.js
│   │   │   └── workorders.js
│   │   │   └── admin/
│   │   │       ├── index.js
│   │   │       ├── requests.js  # 审批管理
│   │   │       ├── activities.js
│   │   │       └── ...
│   │   └── services/cron.js   # 定时任务
│   ├── data/
│   │   └── rsms.db             # SQLite数据库
│   └── uploads/                # 上传文件目录
│
├── rsms-admin/
│   ├── .git/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── api/index.js         # API封装
│   │   ├── views/
│   │   │   ├── VehicleManage.vue
│   │   │   ├── CustomerManage.vue
│   │   │   ├── ActivityManage.vue
│   │   │   ├── ApprovalManage.vue
│   │   │   └── ...
│   │   └── router/
│   └── dist/                    # 构建产物（Nginx root）
│
└── .pm2/                        # PM2配置
```

---

## 十一、部署检查清单

部署完成后逐项确认：

### 基础环境
- [ ] Node.js v22 已安装
- [ ] PM2 已安装且配置开机自启
- [ ] Nginx 已安装
- [ ] fail2ban 已安装且运行中（`sudo fail2ban-client status sshd`）

### 后端
- [ ] rsms-backend 代码已克隆
- [ ] `npm install` 成功（better-sqlite3 编译通过）
- [ ] `.env` 已配置（JWT_SECRET、CORS_ORIGINS）
- [ ] 数据库已初始化（或已迁移旧数据）
- [ ] `pm2 start ecosystem.config.js` 已执行
- [ ] PM2 日志轮转已安装（`pm2 install pm2-logrotate`）
- [ ] `curl localhost:3000/api/health` 返回正常

### 前端
- [ ] rsms-admin 代码已克隆
- [ ] `npm install` 成功
- [ ] `npm run build` 成功生成 dist/

### Nginx + SSL
- [ ] 域名 DNS 已指向新服务器 IP
- [ ] SSL 证书已申请（certbot）
- [ ] Nginx 配置已创建并启用（限流 30r/s + 20r/m）
- [ ] `sudo nginx -t` 测试通过
- [ ] `sudo systemctl reload nginx` 已执行
- [ ] 浏览器访问 `https://域名` 能打开登录页
- [ ] 浏览器登录系统功能正常

### 小程序
- [ ] 小程序 app.js 域名已更新
- [ ] 微信公众平台服务器域名已配置
- [ ] 小程序开发工具能正常访问API

---

## 十二、向服务器供应商索要的权限清单

| 权限 | 说明 |
|------|------|
| SSH root/sudo | 安装系统软件 |
| 80/443端口开放 | HTTP/HTTPS访问 |
| Node.js 22安装 | 后端运行时 |
| PM2全局安装 | 进程守护 |
| Nginx配置 | 反向代理 |
| Git安装+GitHub访问 | 代码拉取 |
| Let's Encrypt/certbot | SSL证书 |
| fail2ban安装 | SSH防暴力破解 |
| 文件读写 | 数据库/上传目录 |
| 防火墙配置 | 安全策略 |
| crontab | 定时任务(如需) |
