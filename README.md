# UN-Habitat Project Tracker

Web app with role-based access for UN-Habitat personnel, donors, and government authorities.

## User Roles
- **UN-Habitat**: Read/write projects & expenditures
- **Donors**: View expenditures only
- **Government**: View project status only

## Quick Start

```bash
npm install
npm start
```

Open `http://localhost:3000` and register an account.
## De
ployment on Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub (make sure `.gitignore` excludes `node_modules/`)
2. Ensure all files are committed

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `un-habitat-tracker` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free tier is fine for testing

### Step 3: Environment Variables (Optional)
In Render dashboard, add these environment variables:
- `SESSION_SECRET`: A random string for session security
- `NODE_ENV`: `production`

### Step 4: Deploy
- Click "Create Web Service"
- Render will automatically deploy your app
- You'll get a URL like `https://your-app-name.onrender.com`

### Important Notes for Render:
- **Database**: Uses SQLite stored in `/tmp/` (data resets on restart)
- **For persistent data**: Consider upgrading to Render's PostgreSQL addon
- **Free tier**: App may sleep after 15 minutes of inactivity