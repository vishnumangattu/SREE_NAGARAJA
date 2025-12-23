import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import CounterDashboard from './pages/counter/CounterDashboard';
import CreateReceipt from './pages/counter/CreateReceipt';
import ReceiptHistory from './pages/counter/ReceiptHistory';
import ReceiptView from './pages/counter/ReceiptView';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerReceipts from './pages/manager/ManagerReceipts';
import VazhipadManager from './pages/manager/VazhipadManager';
import DailyPoojaList from "./pages/manager/DailyPoojaList";
import PostingCoverPrint from './pages/manager/PostingCoverPrint';
import StaffManager from './pages/manager/StaffManager';
import ClosingReport from './pages/counter/ClosingReport';
import ClosingReportsView from './pages/manager/ClosingReportsView';
import UserPerformance from './pages/manager/UserPerformance';
import ManagerStallSales from './pages/manager/ManagerStallSales';
import ManagerDailyClosing from './pages/manager/ManagerDailyClosing';

import StallDashboard from './pages/stall/StallDashboard';
import StallHistory from './pages/stall/StallHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import DeletedReceipts from './pages/admin/DeletedReceipts';
import UserActivityReport from './pages/admin/UserActivityReport';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute allowedRoles={['counter', 'manager', 'superadmin', 'stall']} />}>
            <Route element={<Layout />}>
              {/* Counter Routes */}
              <Route element={<PrivateRoute allowedRoles={['counter', 'superadmin', 'manager']} />}>
                <Route path="/counter" element={<CounterDashboard />} />
                <Route path="/counter/create" element={<CreateReceipt />} />
                <Route path="/counter/history" element={<ReceiptHistory />} />
                <Route path="/counter/receipts/:id" element={<ReceiptView />} />
                <Route path="/counter/closing-report" element={<ClosingReport />} />
              </Route>

              {/* Manager Routes */}
              <Route element={<PrivateRoute allowedRoles={['manager', 'superadmin']} />}>
                <Route path="/manager" element={<ManagerDashboard />} />
                <Route path="/manager/receipts" element={<ManagerReceipts />} />
                <Route path="/manager/posting-covers" element={<PostingCoverPrint />} />
                <Route path="/manager/vazhipads" element={<VazhipadManager />} />
                <Route path="/manager/staff" element={<StaffManager />} />
                <Route path="/manager/closing-reports" element={<ClosingReportsView />} />
                <Route path="/manager/daily-list" element={<DailyPoojaList />} />
                <Route path="/manager/user-performance" element={<UserPerformance />} />
                <Route path="/manager/stalls" element={<ManagerStallSales />} />
                <Route path="/manager/daily-closing" element={<ManagerDailyClosing />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<PrivateRoute allowedRoles={['superadmin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/deleted-receipts" element={<DeletedReceipts />} />
                <Route path="/admin/activity-report" element={<UserActivityReport />} />
              </Route>

              {/* Stall Routes */}
              <Route element={<PrivateRoute allowedRoles={['stall', 'superadmin']} />}>
                <Route path="/stall" element={<StallDashboard />} />
                <Route path="/stall/history" element={<StallHistory />} />
                <Route path="/stall/edit/:id" element={<StallDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
