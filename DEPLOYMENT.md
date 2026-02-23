# 🚀 Deployment Guide (Demo Branch)

Deploy the **WebPushNotify Demo Branch** on your server using Docker. This branch features **User Isolation** and a **Super Admin** mode.

---

## 📋 Prerequisites

| Tool | Link |
|---|---|
| 🐳 **Docker** | [Install Docker](https://docs.docker.com/get-docker/) |
| 🐳 **Docker Compose** | [Install Docker Compose](https://docs.docker.com/compose/install/) |
| 📦 **Git** | Required to clone and switch branches |

---

## 🛠️ Installation Steps

### 1️⃣ Get the Code

```bash
git clone https://github.com/Sasivarnasarma/WebPushNotify.git
cd WebPushNotify
git checkout demo
```

### 2️⃣ Configure Backend (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
ADMIN_SECRET=DemoAdmin
SUPER_ADMIN_SECRET=YourSuperSecretKey
VAPID_SUBJECT=mailto:admin@yourdomain.com
DATABASE_URL=sqlite:///./app.db
ALLOWED_ORIGINS=http://yourdomain.com
```

| Variable | Description |
|---|---|
| `ADMIN_SECRET` | 🔐 Key for **Isolated** sessions (users only see their own data) |
| `SUPER_ADMIN_SECRET` | 👑 Key for **Global** access (see all devices, broadcast to all) |
| `VAPID_SUBJECT` | 📧 VAPID claim subject (`mailto:` URI) |
| `DATABASE_URL` | 🗃️ SQLAlchemy database connection string |
| `ALLOWED_ORIGINS` | 🌐 CORS allowed origins (where your frontend is hosted) |

### 3️⃣ Configure Frontend (`frontend/.env`)

Create a `.env` file in the `frontend/` directory.

> [!IMPORTANT]
> Frontend variables MUST start with `VITE_` to be accessible in the browser.

```env
VITE_API_URL=http://<your-server-ip>:8000
VITE_ADMIN_SECRET=DemoAdmin
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | 🔗 Points to your Backend API |
| `VITE_ADMIN_SECRET` | 🔐 Pre-fills the login page for an easier demo experience |

### 4️⃣ Start the Application

From the root directory, rebuild and start:

```bash
docker-compose up -d --build
```

---

## 📡 Service Access

| Service | Port | Description |
|---|---|---|
| 🌐 **Frontend UI** | `3000` | The user-facing dashboard |
| 🔧 **Backend API** | `8000` | FastAPI server with `/docs` (Swagger) |

---

## 🔧 Maintenance & Logs

```bash
# View all logs
docker-compose logs -f

# Stop the application
docker-compose down
```

> [!CAUTION]
> If using SQLite (default), data is stored inside the container. For production, provide a **PostgreSQL** string in `DATABASE_URL` for external persistence.

---

<h3 align="center">Made with ❤️ and ☕ By @Sasivarnasarma</h3>
