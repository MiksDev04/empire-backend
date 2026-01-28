# Steps to Publish Backend to GitHub

## 1. Initialize Git Repository
```bash
cd backend
git init
```

## 2. Add all files to Git
```bash
git add .
```

## 3. Create initial commit
```bash
git commit -m "Initial commit: Empire backend with authentication"
```

## 4. Create a new repository on GitHub
- Go to https://github.com/new
- Name it: `empire-backend` (or your preferred name)
- Don't initialize with README, .gitignore, or license (we already have these)
- Click "Create repository"

## 5. Link local repository to GitHub
Replace `YOUR_USERNAME` with your GitHub username:
```bash
git remote add origin https://github.com/YOUR_USERNAME/empire-backend.git
```

## 6. Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## Done!
Your backend is now published to a separate GitHub repository.

## Important Notes:
- The `.env` file is in `.gitignore` so it won't be uploaded (this is good for security)
- `node_modules` is also ignored (will be installed via npm install)
- Make sure to update the MongoDB URI and JWT secret in your deployment environment variables
