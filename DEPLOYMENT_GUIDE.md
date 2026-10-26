# FDR Vault — AICTE Security Deposit & FDR Management Portal
## Complete Cloud Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide walks you step-by-step through deploying **FDR Vault** to production:
- **Backend API & Cron Engine:** Deployed on [Render](https://render.com)
- **Frontend React Portal:** Deployed on [Vercel](https://vercel.com)
- **Database:** [MongoDB Atlas](https://cloud.mongodb.com) (Already configured & seeded)

---

### Step 1: Push Code to GitHub

Open PowerShell or Terminal in the `FDR_PRO` root directory:

```bash
# 1. Initialize Git repository
git init

# 2. Stage all files (node_modules, .env, and uploads are safely ignored by .gitignore)
git add .

# 3. Commit
git commit -m "feat: complete production-ready FDR Vault AICTE portal"

# 4. Create a new repository on your GitHub account (e.g., https://github.com/your-username/fdrvault)
# 5. Link and push to GitHub:
git branch -M main
git remote add origin https://github.com/<your-username>/fdrvault.git
git push -u origin main
```

---

### Step 2: Deploy Backend to Render

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → Select **Web Service**.
3. Connect your GitHub repository (`fdrvault`).
4. Configure the service settings:
   - **Name:** `fdrvault-api` (or any name you choose)
   - **Region:** `Singapore` (or closest to India)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` (or `Starter`)

5. Under **Environment Variables**, add the following:

   | Key | Value | Note |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `PORT` | `10000` | Render default port |
   | `MONGODB_URI` | `mongodb+srv://ankitnapit8_db_user:XIteszmpuRLJgP87@cluster0.yibmwiz.mongodb.net/fdrflow?retryWrites=true&w=majority` | Your live Atlas database |
   | `JWT_SECRET` | `4b634405ed1fd1eb0498dc0311d3fd512d45bd88cdb9f0959b4aaaa9aa7d4531` | Production 256-bit secure secret |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry |
   | `CORS_ORIGIN` | `*` | Or specify your Vercel URL later |
   | `STORAGE_DRIVER` | `local` | Upload storage mode |
   | `AUTO_SEED` | `false` | Database is already seeded |

6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, e.g.:
   `https://fdrvault-api.onrender.com`
   *(Test it in browser: `https://fdrvault-api.onrender.com/api/health/ready` should return status `READY`)*

---

### Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository (`fdrvault`).
4. In the Project Configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `client`
   - **Build Command:** `npm run build` *(Default)*
   - **Output Directory:** `dist` *(Default)*
   - **Install Command:** `npm install` *(Default)*

5. Expand **Environment Variables** and add:

   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://fdrvault-api.onrender.com/api` *(Replace with your Render URL + `/api`)* |

6. Click **Deploy**.
7. In ~30 seconds, Vercel will give you your live URL, e.g.:
   `https://fdrvault.vercel.app`

---

### Step 4: (Optional) Lock Down CORS on Render

Once your Vercel URL is live (e.g., `https://fdrvault.vercel.app`), you can optionally restrict CORS on Render:
1. Go to your Render Web Service → **Environment**.
2. Set `CORS_ORIGIN` = `https://fdrvault.vercel.app`
3. Click **Save Changes** (Render will auto-redeploy).

---

### Step 5: Test & Verify Production Deployment

Open your Vercel URL in your browser and test:
1. **Login:** Use quick-fill buttons or credentials:
   - Admin: `admin@aicte.gov.in` / `Admin@123`
   - Scrutiny Officer: `officer@aicte.gov.in` / `Officer@123`
   - Institution: `director@delhitechnical.edu.in` / `Inst@123`
2. **Dashboard:** Verify metrics, instruments, upcoming maturities, and tamper-evident audit logs.
3. **Uploads & OCR:** Test FDR upload and AI discrepancy scanner.
4. **Bank Verification & Clearances:** Test bank verification ticket creation and multi-department release approvals.
