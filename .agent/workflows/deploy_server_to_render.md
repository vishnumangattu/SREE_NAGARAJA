---
description: How to deploy the server (backend) application to Render
---

This guide details the steps to deploy the Node.js/Express backend to Render.

## Prerequisites
- A Render account (render.com)
- The project pushed to a Git repository

## Deployment Steps

1.  **Log in to Render**: Go to [dashboard.render.com](https://dashboard.render.com).
2.  **Create New Web Service**: Click "New" > "Web Service".
3.  **Connect Git Repository**: Select the repository containing your project.
4.  **Configure Service**:
    -   **Name**: Enter a name (e.g., `newpro-server`).
    -   **Region**: Select a region (e.g., Singapore `sin` is usually good for India, or whatever is closest).
    -   **Branch**: `main` (or your default branch).
    -   **Root Directory**: `server` (**Crucial**: This tells Render to look in the server folder).
    -   **Runtime**: `Node`.
    -   **Build Command**: `npm install`
    -   **Start Command**: `npm start`
5.  **Environment Variables**:
    -   Add the necessary environment variables from your local `.env` file. Common ones acturally in use:
        -   `MONGO_URI`: Your MongoDB connection string (Atlas).
        -   `JWT_SECRET`: Your secret key for tokens.
        -   `NODE_ENV`: `production`
6.  **Create Web Service**: Click "Create Web Service".

## Post-Deployment
-   Once deployed, Render will provide a URL (e.g., `https://newpro-server.onrender.com`).
-   **Update Client**: Copy this URL and update the `VITE_API_URL` environment variable in your Vercel client deployment to point to this new backend URL.
