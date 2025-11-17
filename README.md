# MediConnect - Clinic Appointment System

A modern clinic appointment management system built with Supabase as the backend.

## Features

- 🔐 User Authentication (Login/Register)
- 📅 Appointment Booking
- 👩‍⚕️ Physician Triage Dashboard
- 📋 Patient Dashboard
- 🎨 Modern, Responsive UI with Dark Mode
- ☁️ Powered by Supabase (Database, Auth, Real-time)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Hosting**: GitHub Pages (Static Hosting)

## Setup

### Prerequisites

- A Supabase account (free tier works)
- GitHub account

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Create the following tables in your Supabase SQL Editor:

```sql
-- Users table (optional, can use Supabase Auth metadata)
-- IMPORTANT: Do NOT include a password column - passwords are handled by Supabase Auth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If your users table already has a password column, remove it:
-- ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  phone TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE,
  doctor_name TEXT,
  specialty TEXT,
  reason TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended)
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- Allow users to see their own appointments
CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  USING (patient_email = auth.jwt() ->> 'email');

-- Allow authenticated users to insert appointments
CREATE POLICY "Authenticated users can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow physicians to view pending appointments
CREATE POLICY "Physicians can view pending appointments"
  ON appointments FOR SELECT
  USING (
    status = 'Pending'
    OR patient_email = auth.jwt() ->> 'email'
  );
```

3. Get your Supabase URL and Anon Key from Project Settings > API
4. Update `main.js` with your Supabase credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 2. Local Development (Optional)

If you want to test locally with the optional Express server:

```bash
npm install
npm start
```

Visit `http://localhost:8080`

**Note**: The Express server is optional. The app works entirely with Supabase, so you can skip this step.

### 3. GitHub Pages Deployment

#### Option A: Deploy via GitHub Web Interface

1. Create a new repository on GitHub
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
3. Go to your repository on GitHub
4. Click **Settings** > **Pages**
5. Under **Source**, select **Deploy from a branch**
6. Select branch: **main** (or **master**)
7. Select folder: **/ (root)**
8. Click **Save**
9. Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

#### Option B: Deploy via gh-pages Branch

```bash
# Create gh-pages branch
git checkout -b gh-pages

# Remove node_modules and server files if committed
git rm -r --cached node_modules server.js server/

# Push to gh-pages branch
git push origin gh-pages
```

Then in GitHub Settings > Pages, select **gh-pages** branch as source.

#### Option C: Use GitHub Actions (Automated)

See the `.github/workflows/deploy.yml` file for automated deployment.

### 4. Update Supabase CORS Settings

1. Go to Supabase Dashboard > Project Settings > API
2. Add your GitHub Pages URL to **Allowed Origins**:
   - `https://YOUR_USERNAME.github.io`
   - Or your custom domain if using one

### 5. Update HTML Files

Make sure all your HTML files include the Supabase CDN script before `main.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="main.js"></script>
```

## Project Structure

```
clinic-app-system/
├── index.html              # Home page
├── login.html              # Login page
├── register.html           # Registration page
├── booking.html            # Appointment booking
├── appointment.html        # View appointments
├── dashboard.html          # Patient dashboard
├── triage.html             # Physician triage dashboard
├── main.js                 # Main application logic (Supabase client)
├── style.css               # Styles
├── .gitignore              # Git ignore rules
├── .nojekyll               # Disable Jekyll on GitHub Pages
├── README.md               # This file
└── package.json            # Dependencies (optional, for local dev)
```

## Important Notes

- ⚠️ **Security**: The Supabase Anon Key is exposed in the frontend. This is expected for public apps, but make sure to:
  - Set up Row Level Security (RLS) policies in Supabase
  - Never use the Service Role Key in frontend code
- 📦 **Node Modules**: Not needed for GitHub Pages since Supabase is loaded via CDN
- 🚀 **Server.js**: Not needed for GitHub Pages deployment. It's only useful for local development or if you need server-side email/SMS functionality.

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in the root with your domain name
2. Configure DNS settings on your domain provider
3. Update Supabase CORS settings with your custom domain

## Support

For issues or questions:

- Check Supabase documentation: https://supabase.com/docs
- GitHub Pages documentation: https://docs.github.com/en/pages

## License

ISC
