import { useContext, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Home, PlusCircle, List, LogOut, Menu, X, Users, Trash2, Clock, Key, Printer } from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const isActive = (path) => location.pathname === path;

    const navItems = {
        counter: [
            { name: 'Dashboard', path: '/counter', icon: <Home size={20} /> },
            { name: 'New Receipt', path: '/counter/create', icon: <PlusCircle size={20} /> },
            { name: 'History', path: '/counter/history', icon: <List size={20} /> },
            { name: 'Closing Report', path: '/counter/closing-report', icon: <List size={20} /> },
        ],
        manager: [
            { name: 'Dashboard', path: '/manager', icon: <Home size={20} /> },
            { name: 'New Receipt', path: '/counter/create', icon: <PlusCircle size={20} /> },
            { name: 'Manage Receipts', path: '/manager/receipts', icon: <List size={20} /> },
            { name: 'Manage Vazhipads', path: '/manager/vazhipads', icon: <List size={20} /> },
            { name: 'Manage Staff', path: '/manager/staff', icon: <List size={20} /> },
            { name: 'User Performance', path: '/manager/user-performance', icon: <Users size={20} /> },
            { name: 'Closing Reports', path: '/manager/closing-reports', icon: <List size={20} /> },
            { name: 'Daily Pooja List', path: '/manager/daily-list', icon: <List size={20} /> },
            { name: 'Posting Covers', path: '/manager/posting-covers', icon: <Printer size={20} /> },
        ],
        superadmin: [
            { name: 'Admin Dashboard', path: '/admin', icon: <Home size={20} /> },
            { name: 'Manage Receipts', path: '/manager/receipts', icon: <List size={20} /> },
            { name: 'Manage Staff', path: '/manager/staff', icon: <Users size={20} /> },
            { name: 'Manage Vazhipads', path: '/manager/vazhipads', icon: <List size={20} /> },
            { name: 'Activity Report', path: '/admin/activity-report', icon: <Clock size={20} /> },
            { name: 'User Performance', path: '/manager/user-performance', icon: <Users size={20} /> },
            { name: 'Closing Reports', path: '/manager/closing-reports', icon: <List size={20} /> },
            { name: 'Daily Pooja List', path: '/manager/daily-list', icon: <List size={20} /> },
            { name: 'Deleted Logs', path: '/admin/deleted-receipts', icon: <Trash2 size={20} /> },
            { name: 'Posting Covers', path: '/manager/posting-covers', icon: <Printer size={20} /> },
        ],
        stall: [
            { name: 'Stall Dashboard', path: '/stall', icon: <Home size={20} /> },
        ]
    };

    const role = user?.role || 'counter';
    const items = navItems[role] || [];

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="brand"><img src="images.png" alt="" style={{ height: '80%' }} /><img src="ai.png" alt="" style={{ width: '60%' }} /></div>
                <nav className="sidebar-nav">
                    {items.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                        >
                            {item.icon}
                            <span style={{ marginLeft: '0.75rem' }}>{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div style={{ padding: '1rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setShowPasswordModal(true)}
                        className="logout-btn mb-2"
                        title="Change Password"
                    >
                        <Key size={20} />
                        <span style={{ marginLeft: '0.75rem' }}>Change Password</span>
                    </button>
                    <button
                        onClick={logout}
                        className="logout-btn"
                    >
                        <LogOut size={20} />
                        <span style={{ marginLeft: '0.75rem' }}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="header">
                    <button onClick={toggleSidebar} className="mobile-toggle no-print">
                        <span style={{ display: 'inline-block', lineHeight: 0 }}>
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </span>
                    </button>
                    <div className="user-info">
                        <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                        <span style={{ fontWeight: 500 }}>{user?.name} ({user?.role})</span>
                    </div>
                </header>

                {/* Main Area */}
                <main className="page-content">
                    <Outlet />
                </main>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40
                    }}
                ></div>
            )}
        </div>
    );
};

export default Layout;
