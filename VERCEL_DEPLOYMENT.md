# Deploy Backend to Vercel

## Prerequisites
- GitHub account with your backend repository
- Vercel account (sign up at https://vercel.com)

## Deployment Steps

### 1. Push your code to GitHub first
```bash
cd backend
git add .
git commit -m "Add Vercel configuration"
git push
```

### 2. Deploy to Vercel

**Option A: Using Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/new
2. Import your `empire-backend` repository
3. Configure the project:
   - **Framework Preset:** Other
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (or leave empty)
   - **Output Directory:** `./` (leave as is)
   - **Install Command:** `npm install`

4. Add Environment Variables:
   - Click "Environment Variables"
   - Add:
     - `MONGODB_URI` = `mongodb+srv://Vercel-Admin-empire-db:qedBsnNnfHFNvVw9@empire-db.d5a8bkf.mongodb.net/?retryWrites=true&w=majority`
     - `JWT_SECRET` = `empire_secret_key_2026_super_secure_jwt_token`

5. Click "Deploy"

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
cd backend
vercel
```
Then follow the prompts and add environment variables in the dashboard.

### 3. After Deployment
- Your API will be available at: `https://your-project-name.vercel.app`
- Update your frontend `.env` file:
  ```
  VITE_API_URL=https://your-project-name.vercel.app
  ```

### 4. Test Your API
- Visit: `https://your-project-name.vercel.app/`
- Should see: "Hello from the Empire backend!"
- Test signup: `POST https://your-project-name.vercel.app/api/auth/signup`
- Test signin: `POST https://your-project-name.vercel.app/api/auth/signin`

## Important Notes

- **Build Command:** `npm run build` (it's just an echo command, no actual build needed)
- **Start Command:** Vercel automatically uses `npm start`
- The `vercel.json` file configures Vercel to route all requests through `index.js`
- Environment variables MUST be set in Vercel dashboard
- MongoDB connection should work since you're using MongoDB Atlas (cloud)

## Troubleshooting

If deployment fails:
1. Check the deployment logs in Vercel dashboard
2. Ensure all dependencies are in `dependencies` (not `devDependencies`)
3. Make sure `vercel.json` is committed to your repository
4. Verify environment variables are set correctly

## CORS Configuration

After deployment, you may need to update CORS in `index.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend-domain.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```
