# Quick Start Guide - GitHub Pages Deployment

## 🚀 Deploy in 5 Minutes

### Step 1: Prepare Your Code ✅

All files are ready! The following files have been created:
- ✅ `.gitignore` - Excludes node_modules and server files
- ✅ `.nojekyll` - Ensures GitHub Pages serves all files
- ✅ `.github/workflows/deploy.yml` - Automated deployment

### Step 2: Create GitHub Repository

```bash
# Option A: Using GitHub CLI (if installed)
gh repo create YOUR_REPO_NAME --public --source=. --remote=origin --push

# Option B: Manual Steps
# 1. Go to github.com and create new repository
# 2. Don't initialize with README
# 3. Copy the repository URL
```

### Step 3: Push to GitHub

```bash
# If not already a git repo
git init

# Add files
git add .

# Commit
git commit -m "Initial commit - MediConnect Clinic App"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to main
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to repository on GitHub
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **/ (root)**
5. Click **Save**

### Step 5: Wait & Access

- Wait 1-2 minutes
- Your site: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Step 6: Update Supabase CORS

1. Supabase Dashboard → **Settings** → **API**
2. Add to **Allowed Origins**:
   ```
   https://YOUR_USERNAME.github.io
   ```

## ✅ Done!

Your app is now live on GitHub Pages! 🎉

## 📝 Next Steps

- Test all features (login, booking, dashboard)
- Set up Row Level Security in Supabase (see README.md)
- Optional: Add custom domain

## 🆘 Troubleshooting

**Site shows 404?**
- Wait 2-3 minutes after first deployment
- Check Settings > Pages to ensure deployment succeeded

**Supabase errors?**
- Verify CORS settings
- Check browser console for errors
- Ensure Supabase credentials are correct in `main.js`

**Files not updating?**
- Clear browser cache
- Check if changes were pushed to GitHub
- GitHub Pages takes 1-2 minutes to update

For detailed instructions, see [DEPLOY.md](DEPLOY.md)

