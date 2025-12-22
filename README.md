# Temple Management System (TMS)

A comprehensive web-based application designed to streamline the daily operations of a temple. This system handles receipt generation (Vazhipadu), daily pooja scheduling, financial reporting, staff management, and user performance tracking. It is built using the **MERN Stack** (MongoDB, Express, React, Node.js).

## 🚀 Features

### 🔹 **User Roles & Access Control**
*   **Counter Staff**: Create receipt, view history, generate daily closing reports.
*   **Manager**: Manage vazhipads, staff, view daily pooja lists, monitor user performance, and oversee closing reports.
*   **Super Admin**: Full system access, including activity logs and sensitive configurations.
*   **Stall User**: Dedicated interface for stall-related operations.

### 🔹 **Core Functionalities**
*   **Receipt Generation**:
    *   Support for **Malayalam & English** input (via transliteration).
    *   **Recurring Bookings**: "Everyday", "Every Week", "Once a Month" booking modes.
    *   **Payment Methods**: Cash, UPI/GPay, Online Transaction, Money Order.
    *   **Printable Receipts**: Auto-formatted thermal print layouts.
*   **Daily Pooja List**:
    *   Auto-generated list of poojas for any specific date.
    *   **Smart Deduplication**: Merges multiple bookings for the same person/star into a single entry for the Poojari's "Reading List".
    *   **Filtering**: Filter by Vazhipadu type (Ganapathy Homam, Archana, etc.).
*   **Financial Reporting**:
    *   **Closing Reports**: Daily reconciliation of physical cash vs system records.
    *   **Discrepancy Tracking**: Automatically calculates cash shortages/excesses.
    *   **Detailed Breakdowns**: Separate tracking for Digital Payments (UPI) vs Cash.
*   **User Performance**:
    *   Manager module to granularly track staff collection performance over custom date ranges.

## 🛠️ Tech Stack

### **Frontend (Client)**
*   **React.js** (Vite)
*   **React Router** (Navigation)
*   **Axios** (API Communication)
*   **Lucide React** (Icons)
*   **React-to-Print** (Printing functionality)
*   **Indic-Transliterate** (Manglish typing support)
*   **Kollavarsham** (Malayalam Calendar support)

### **Backend (Server)**
*   **Node.js & Express.js**
*   **MongoDB** (Database via Mongoose)
*   **JWT** (Authentication)
*   **BCrypt** (Password Hashing)
*   **Helmet & CORS** (Security)

## 📂 Project Structure

```
NEWPRO/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application Pages (Counter, Manager, Admin)
│   │   ├── context/        # Auth Context
│   │   └── utils/          # API helpers
├── server/                 # Express Backend
│   ├── controllers/        # Business Logic
│   ├── models/             # Mongoose Schemas (Receipt, User, etc.)
│   ├── routes/             # API Endpoints
│   └── middleware/         # Auth & Error handling
└── README.md               # Project Documentation
```

## ⚙️ Installation & Setup

### **Prerequisites**
*   Node.js (v14+ recommended)
*   MongoDB (Local or Atlas URI)

### **1. Backend Setup**
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Start the backend server:
```bash
nodemon server.js
# Server runs on http://localhost:5000
```

### **2. Frontend Setup**
Navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

Start the development server:
```bash
npm run dev
# Client runs on http://localhost:5173
```

## 📜 Usage Guide for Common Tasks

1.  **Creating a Receipt**:
    *   Login as a Counter User.
    *   Go to **New Receipt**.
    *   Select "Star" (Nakshatram) and "Vazhipadu".
    *   Type Name in English (it auto-converts to Malayalam).
    *   Click **Submit**.

2.  **Closing the Day**:
    *   Go to **Closing Report**.
    *   Enter the count of each cash denomination (500x, 100x, etc.).
    *   The system calculates the total and compares it with recorded cash.
    *   Submit the report.

3.  **Generating Pooja List (Manager)**:
    *   Login as Manager.
    *   Go to **Daily Pooja List**.
    *   Select a Date.
    *   The system generates a clean list for the Poojari (duplicates merged).
    *   Click **Print List**.

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Built for Temple Administration Efficiency.*
