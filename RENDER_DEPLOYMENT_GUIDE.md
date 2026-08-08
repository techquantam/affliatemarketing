# Render Backend Deployment Guide (Cyvanta Cashback)

This guide walks you through deploying the Spring Boot Java backend to **Render.com**.

---

## 📋 Prerequisites
1. **GitHub Account & Repository**: Push this codebase to GitHub if you haven't already.
2. **Render Account**: Sign up/Log in at [render.com](https://render.com).
3. **MongoDB Atlas Database**: Live MongoDB URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/affiliate-app?retryWrites=true&w=majority`).

---

## 🚀 Option 1: Manual Web Service Setup (Recommended)

1. **Log into Render Dashboard**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click **New +** → Select **Web Service**.

2. **Connect Repository**:
   - Choose **Build and deploy from a Git repository**.
   - Select your GitHub repository (`cyvantacashback-new`).

3. **Configure Web Service Settings**:
   - **Name**: `cyvanta-backend` (or any preferred name)
   - **Region**: Choose closest to your users (e.g., *Singapore* or *Oregon*)
   - **Branch**: `main` (or `master`)
   - **Root Directory**: `backend` *(Crucial: set this so Render finds `Dockerfile` inside `backend/`)*
   - **Runtime / Environment**: **Docker**
   - **Dockerfile Path**: `backend/Dockerfile` (or `./Dockerfile` relative to Root Directory `backend`)
   - **Instance Type**: **Free**

4. **Environment Variables**:
   In the **Environment Variables** section, add the following required keys:

   | Key | Example / Recommended Value | Description |
   |---|---|---|
   | `MONGODB_URI` | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/affiliate-app` | **Required**: Your MongoDB Atlas Connection String |
   | `MONGODB_DATABASE` | `affiliate-app` | Database name |
   | `JWT_SECRET` | `cyvanta_super_secret_jwt_key_2026_production_32char` | Secret key for JWT generation |
   | `JWT_EXPIRATION` | `86400000` | Token expiration (24h in ms) |
   | `APP_CORS_ORIGINS` | `*` (or your frontend Vercel/Netlify URL) | Allowed CORS domains |

5. **Deploy**:
   - Click **Create Web Service**.
   - Render will build the Docker container and deploy your Spring Boot app automatically.

---

## ⚡ Option 2: Render Blueprint (1-Click Deployment)

If your repository has the included `render.yaml` at root:
1. In Render Dashboard, click **New +** → Select **Blueprint**.
2. Select your repository.
3. Render will read `render.yaml`, set up the Docker service automatically, and prompt you to input `MONGODB_URI`.
4. Click **Apply**.

---

## ⚠️ Important MongoDB Atlas Checklist

To allow Render backend to connect to MongoDB Atlas:
1. Open [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Go to **Network Access** → Click **Add IP Address**.
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) or add Render IP ranges.
4. Click **Confirm**.

---

## 🧪 Testing Your Deployed Backend

Once Render deployment shows **Live**:
- Access your backend URL (e.g. `https://cyvanta-backend.onrender.com/api/users`).
- Update your Frontend environment variable:
  ```env
  VITE_API_BASE_URL=https://cyvanta-backend.onrender.com/api
  ```
