# StudyHub (Academia Stack)

A modern, student-focused platform to share and discover academic resources (notes, PDFs, previous papers, assignments) across departments and years. Built with React + Vite + TypeScript, Tailwind, shadcn/ui, and Supabase.

## ✨ Features
- Resource browsing, filtering, and sorting (Recent, Likes, Rating, Downloads)
- Responsive UI with beautiful animations and micro-interactions
- Preview & download resources
- Likes and ratings
- Pull-to-refresh and skeleton loading states
- Auth (sign up/sign in) with Supabase
- Forgot/reset password flow with secure email links
- Profile and upload pages
- Dynamic hero stats (resources shared, active students, departments)
- Deployed easily to Vercel

## 🛠 Tech Stack
- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui (Radix UI)
- Supabase (Auth, DB, Storage)
- React Router v6
- Lucide Icons

## 📁 Project Structure
```
src/
  components/
    Header.tsx, HeroSection.tsx, FilterSection.tsx, ResourceCard.tsx, ...
  pages/
    Index.tsx, Auth.tsx, Dashboard.tsx, Resources.tsx, Upload.tsx, Profile.tsx
  hooks/
  integrations/supabase/
  assets/
```

## 🚀 Getting Started

### 1) Prerequisites
- Node.js 18+
- Supabase project (URL + anon key)

### 2) Install
```
npm install
```

### 3) Environment Variables
Create a `.env` (or set in Vercel) with:
```
VITE_PUBLIC_SITE_URL=https://your-domain.vercel.app   # or http://localhost:5173 for dev
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4) Supabase Auth URLs
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: same as `VITE_PUBLIC_SITE_URL`
- Additional Redirect URLs: include `http://localhost:5173` and your production domain

### 5) Development
```
npm run dev
```
- App: `http://localhost:5173`

### 6) Build & Preview
```
npm run build
npm run preview
```

## 🔐 Forgot / Reset Password Flow
- Auth page → Reset tab or “Forgot password?” link
- Sends password reset email via Supabase
- Email link redirects to `/reset-password`
- Reset page restores recovery session and updates password
- On success, redirects to Sign In

## 🧭 Filters & Sorting
- Filters: department, year, type, subject, search
- Sort by: Recent (createdAt), Likes, Rating, Downloads
- Clear All resets filters and UI state (Resources + Dashboard)

## 🖼 Branding & Icons
- Logo and favicon sourced from Cloudinary
- Favicon includes multiple sizes (16–1024) for crisp display

## 🎨 Animations & UX
- Animated gradient background, hover-lift, button ripple
- Section fade/slide/scale-in animations
- Underline slide on nav hover

## ☁️ Deploy to Vercel
- `vercel.json` included (SPA routing and asset caching)
- Set env vars in Vercel Project → Settings → Environment Variables:
  - `VITE_PUBLIC_SITE_URL`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Deploy from your Git repo; Vercel will run `npm run build` and serve `dist`

## 🗃 Database
- Supabase schema expected:
  - `resources`: id, title, description, resource_type, department, year, subject, file_url, uploaded_by, likes_count, download_count, created_at
  - `profiles`: user_id, full_name, department, year, section
  - `likes`: resource_id, user_id
  - `ratings`: resource_id, user_id, rating

## 🧩 Troubleshooting
- Favicon not updating: hard-refresh (Ctrl/Cmd+Shift+R) or clear site data
- Reset password shows “auth session missing”: ensure you open the email link; Supabase URLs must match `VITE_PUBLIC_SITE_URL`
- Filters not working: verify department/year/type values match your DB values (e.g., `IT`, `MECH`, `1st`)
- Supabase CORS/Auth errors: confirm URL Configuration (Site/Redirect URLs) and env vars

## 📜 License
MIT
