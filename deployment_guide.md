# 🚀 Deployment Guide for PragmaGuard

PragmaGuard consists of a **Next.js frontend** and a **FastAPI backend**. Since the backend uses heavy ML models (PyTorch, Sentence-BERT), it requires a hosting environment with at least **2GB of RAM**.

---

## 📺 Option 1: The "Modern Cloud" Way (Recommended)
This approach splits the app into two parts for the best performance and ease of use.

### 1. Backend (FastAPI + PyTorch)
Host the backend on **[Render](https://render.com/)**, **[Railway](https://railway.app/)**, or **[Heroku](https://www.heroku.com/)**.

- **Why**: These services support Python environments and can handle the large memory footprint of PyTorch and Sentence-BERT.
- **Steps**:
    1. Connect your GitHub repository.
    2. Set the Root Directory to `backend/`.
    3. Set the Build Command: `pip install -r requirements.txt`.
    4. Set the Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
    5. **Critical**: Add your `ETHERSCAN_API_KEY` to the service's Environment Variables.

### 2. Frontend (Next.js)
Host the frontend on **[Vercel](https://vercel.com/)**.

- **Why**: Vercel is the creator of Next.js and provides the fastest global delivery.
- **Steps**:
    1. Connect your GitHub repository.
    2. Set the Root Directory to `frontend/`.
    3. Ensure you set the `NEXT_PUBLIC_API_URL` environment variable to point to your deployed Render/Railway backend URL.
    4. Deploy!

---

## 🐳 Option 2: The "Containerized" Way (Docker)
Use this if you want to host everything on a single **VPS** (DigitalOcean, AWS EC2, or Linode).

### 1. Create a `docker-compose.yml`
In the root of your project:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://your-vps-ip:8000
    depends_on:
      - backend
    restart: always
```

### 2. Deployment
1. SSH into your VPS.
2. Clone the repo.
3. Run `docker-compose up -d --build`.

---

## ⚠️ Important Considerations

### 1. API URL Configuration
In your `frontend/app/page.js`, ensure your `fetch` calls use an environment variable so they work in production. Currently, they use relative paths (e.g., `/api/predict`), which works if you use a proxy or a single-domain setup. For multi-domain (Vercel + Render), you must provide the full URL.

### 2. Memory Limits
The `Sentence-BERT` model and the two `MLP` models will consume about **1.2GB - 1.5GB of RAM** upon loading. Do not use "Free Tier" plans that limit RAM to 512MB, as the backend will crash with an `Out of Memory` error.

### 3. Etherscan API Key
Never hardcode your API key. Always use the deployment platform's Secret Management.

---

## ✅ Final Checklist
1. [ ] Backend deployed to a service with **>2GB RAM**.
2. [ ] `ETHERSCAN_API_KEY` added to production environment variables.
3. [ ] Frontend `fetch` calls point to the production Backend URL.
4. [ ] SSL (HTTPS) enabled on both.
