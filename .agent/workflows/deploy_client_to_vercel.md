---
description: How to deploy the client application to Vercel
---

This guide details the steps to deploy the React client to Vercel.

## Prerequisites
- A Vercel account
- The project pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**: Click on "Add New..." > "Project".
3.  **Import Git Repository**: Select the repository containing your project.
4.  **Configure Project**:
    -   **Project Name**: Enter a name (e.g., `newpro-client`).
    -   **Framework Preset**: Vercel should automatically detect **Vite**. If not, select it manually.
    -   **Root Directory**: Click "Edit" and select `client`. **This is critical** because your frontend code lives in the `client` folder.
5.  **Build and Output Settings** (Verify these match):
    -   **Build Command**: `npm run build`
    -   **Output Directory**: `dist`
    -   **Install Command**: `npm install`
6.  **Environment Variables**:
    -   Add `VITE_API_URL` if your client needs to talk to a backend deployed elsewhere (e.g., Render, Heroku, Railway).
    -   Example: `VITE_API_URL` = `https://your-backend-api.com/api`
7.  **Deploy**: Click "Deploy".

## Troubleshooting
-   **404 on Refresh**: If you experience 404 errors when refreshing pages (client-side routing), you need to ensure all requests are rewritten to `index.html`.
    -   Create a `vercel.json` file in the `client` directory with the following content:
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
