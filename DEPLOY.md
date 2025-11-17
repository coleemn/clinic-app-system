# GitHub Pages Deployment Guide

Quick guide to deploy MediConnect to GitHub Pages.

## Prerequisites

- ✅ GitHub account
- ✅ Supabase project set up
- ✅ All files committed to Git

## Step-by-Step Deployment

### 1. Create GitHub Repository

1. Go to [github.com](https://github.com) and create a new repository
2. Name it (e.g., `clinic-app-system` or `mediconnect`)
3. Choose **Public** (GitHub Pages is free for public repos)
4. **Don't** initialize with README (if you already have files)

### 2. Push Your Code

Open terminal in your project directory and run:

```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for GitHub Pages"

# Add remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Scroll to **Pages** (left sidebar)
4. Under **Source**:
   - Select **Deploy from a branch**
   - Branch: **main** (or **master**)
   - Folder: **/ (root)**
5. Click **Save**
6. Wait 1-2 minutes for deployment

### 4. Access Your Site

Your site will be available at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

For example:
- `https://johndoe.github.io/clinic-app-system/`

### 5. Update Supabase CORS

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** > **API**
3. Under **Allowed Origins**, add:
   - `https://YOUR_USERNAME.github.io`
   - Or your custom domain if using one

### 6. Update Supabase URL (if needed)

If you're using relative paths in `main.js`, you're good. If you need to update the Supabase URL:

1. Edit `main.js`
2. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` if changed

### 7. Test Your Deployment

1. Visit your GitHub Pages URL
2. Test login/register
3. Test appointment booking
4. Check browser console for errors

## Alternative: Use gh-pages Branch

If you prefer a separate branch for deployment:

```bash
# Create and switch to gh-pages branch
git checkout -b gh-pages

# Remove server files if committed
git rm server.js server/ -r

# Commit
git commit -m "Deploy to gh-pages"

# Push
git push origin gh-pages
```

Then in GitHub Settings > Pages, select **gh-pages** as source branch.

## Automated Deployment (GitHub Actions)

The `.github/workflows/deploy.yml` file is already configured for automated deployment.

- ✅ Automatically deploys on every push to `main` or `master`
- ✅ No manual steps needed
- ✅ Uses GitHub Actions (free for public repos)

Just push your code and it will deploy automatically!

## Custom Domain (Optional)

1. In your repository, go to **Settings** > **Pages**
2. Under **Custom domain**, enter your domain (e.g., `app.yourdomain.com`)
3. Add a `CNAME` file in your repository root with your domain name
4. Configure DNS on your domain provider:
   - Type: `CNAME`
   - Name: `app` (or `www`)
   - Value: `YOUR_USERNAME.github.io`
5. Update Supabase CORS with your custom domain

## Troubleshooting

### Site not loading?
- Check GitHub Actions tab for deployment errors
- Verify branch is set correctly in Settings > Pages
- Wait 2-3 minutes after first deployment

### Supabase errors?
- Verify CORS settings in Supabase Dashboard
- Check browser console for error messages
- Ensure Supabase URL and Anon Key are correct

### Files not updating?
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check if changes were pushed to GitHub
- GitHub Pages can take 1-2 minutes to update

### 404 errors on refresh?
- This is normal for SPAs on GitHub Pages
- Consider using a custom domain or hosting provider with SPA support
- Or add a 404.html that redirects to index.html

## Need Help?

- GitHub Pages Docs: https://docs.github.com/en/pages
- Supabase Docs: https://supabase.com/docs
- Check repository Issues for common problems

