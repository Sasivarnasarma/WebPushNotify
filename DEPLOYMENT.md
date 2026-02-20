# 🚀 Deployment Guide

Deploy the **WebPushNotify** app on your server using Docker in just a few steps!

---

## 📋 Prerequisites

Make sure your server has these installed:

| Tool | Link |
|---|---|
| 🐳 **Docker** | [Install Docker](https://docs.docker.com/get-docker/) |
| 🐳 **Docker Compose** | [Install Docker Compose](https://docs.docker.com/compose/install/) |
| 📦 **Git** *(optional)* | For cloning the repo |

---

## 🛠️ Installation Steps

### 1️⃣ Get the Code

```bash
git clone https://github.com/Sasivarnasarma/WebPushNotify.git
cd WebPushNotify
```

> [!TIP]
> If you're not using git, just upload the `backend/`, `frontend/`, and `docker-compose.yml` to a directory on your server.

### 2️⃣ Configure Environment Variables

Navigate to the `backend/` directory and create a `.env` file:

```bash
cd backend
nano .env
```

Add the following (update with your own values):

```env
DATABASE_URL=sqlite:///./app.db
# Or use PostgreSQL:
# DATABASE_URL=postgresql://user:password@host:port/dbname
ADMIN_SECRET=YourSecureSecretHere
VAPID_SUBJECT=mailto:admin@yourdomain.com
VAPID_TTL=259200
ALLOWED_ORIGINS=http://yourdomain.com
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | 🗃️ SQLAlchemy database connection string |
| `ADMIN_SECRET` | 🔐 Secret key for admin authentication |
| `VAPID_SUBJECT` | 📧 VAPID claim subject (`mailto:` URI) |
| `VAPID_TTL` | ⏱️ Push message TTL in seconds (default: 3 days) |
| `ALLOWED_ORIGINS` | 🌐 CORS allowed origins (comma-separated) |

> [!IMPORTANT]
> Make sure to change `ADMIN_SECRET` to something strong! This is the key that protects your admin panel. 🔐

#### 🌐 Frontend Environment

Navigate to `frontend/` and create a `.env` file:

```bash
cd ../frontend
nano .env
```

```env
API_URL=http://<your-server-ip>:8000
```

| Variable | Description |
|---|---|
| `API_URL` | 🔗 Backend API base URL (point to your server) |

> [!NOTE]
> The frontend needs to know where the backend API is running. Update `API_URL` to match your server's address.

### 3️⃣ Start the Application

Go back to the root directory and spin up the containers:

```bash
cd ..
docker-compose up -d --build
```

| Flag | What it does |
|---|---|
| `-d` | 🔄 Runs containers in the background (detached mode) |
| `--build` | 🔨 Forces a fresh rebuild of the images |

### 4️⃣ Verify Deployment

Check if everything is running:

```bash
docker-compose ps
```

You should see both containers with status **Up** ✅:

| Container | Status |
|---|---|
| `web-push-backend` | ✅ Up |
| `web-push-frontend` | ✅ Up |

### 5️⃣ Access the Application

| Service | URL | Description |
|---|---|---|
| 🌐 **Frontend** | `http://<your-server-ip>:3000` | The web app (Nginx → port 80 inside container) |
| 🔧 **Backend API** | `http://<your-server-ip>:8000` | FastAPI server |
| 📄 **API Docs** | `http://<your-server-ip>:8000/docs` | Swagger UI documentation |

---

## 🔧 Maintenance

### 📋 Viewing Logs

```bash
# 🌐 Frontend logs
docker-compose logs -f frontend

# 🔧 Backend logs
docker-compose logs -f backend

# 📋 All logs
docker-compose logs -f
```

### 🔄 Updating the App

1. Pull the latest code (if using git):
   ```bash
   git pull
   ```
2. Rebuild and restart:
   ```bash
   docker-compose up -d --build
   ```

### 🛑 Stopping the App

```bash
docker-compose down
```

> [!CAUTION]
> If you are using SQLite, data is stored inside the container's `/app/app.db` by default. For production, it is highly recommended to use a **PostgreSQL** database by providing a connection string in `DATABASE_URL`. This ensures your data persists even if the container is removed.

---

## 📁 Docker Architecture

```
┌─────────────────────────────────────────────┐
│              docker-compose.yml             │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Backend         │  Frontend                │
│  (FastAPI)       │  (Nginx + React)         │
│  Port: 8000      │  Port: 3000 → 80         │
│  Python 3.10     │  Node 18 → Nginx Alpine  │
│                  │                          │
└──────────────────┴──────────────────────────┘
```

---

<h3 align="center">Made with ❤️ and ☕ By @Sasivarnasarma</h3>
