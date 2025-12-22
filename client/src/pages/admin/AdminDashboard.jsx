import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Shield, Trash2, FileText, LayoutDashboard, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        activeUsers: 0,
        totalReceipts: 0,
        deletedReceipts: 0,
        collectionToday: 0,
        cashTotal: 0,
        upiTotal: 0,
        onlineTxnTotal: 0,
        moneyOrderTotal: 0,
        paymentBreakdown: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [usersRes, receiptsRes, deletedRes, activeRes, statsRes] = await Promise.all([
                api.get('/users'),
                api.get('/receipts'), // Active
                api.get('/receipts?deleted=true'), // Deleted
                api.get('/auth/active-users'), // Active Users
                api.get('/receipts/stats/manager') // Daily Stats
            ]);

            setStats({
                activeUsers: usersRes.data.length,
                totalReceipts: receiptsRes.data.length,
                deletedReceipts: deletedRes.data.length,
                onlineUsers: activeRes.data.length,
                collectionToday: statsRes.data.totalCollectionToday,
                cashTotal: statsRes.data.cashTotal || 0,
                upiTotal: statsRes.data.upiTotal || 0,
                onlineTxnTotal: statsRes.data.onlineTxnTotal || 0,
                moneyOrderTotal: statsRes.data.moneyOrderTotal || 0,
                paymentBreakdown: statsRes.data.paymentBreakdown
            });
            setLoading(false);
        } catch (error) {
            console.error("Admin data fetch failed", error);
            setLoading(false);
        }
    };

    if (loading) return <div>Loading Admin Panel...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold border-b pb-4 mb-6">Super Admin Console</h1>

            {/* Stats Overview */}

            {/* Financial Overview (Same as Manager) */}
            <h3 className="text-xl font-bold mb-4 mt-8">Daily Financial Overview</h3>
            <div className="grid grid-auto-fit">
                <div className="card card--accent">
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Total Collection Today</p>
                            <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>₹ {stats.collectionToday?.toLocaleString() || 0}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="card card--light" style={{ gridColumn: 'span 2' }}>
                    <div className="flex justify-between items-center">
                        <div style={{ width: '100%' }}>
                            <p className="text-muted text-sm">Payments Breakdown (Today)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                {/* Cash */}
                                <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                                    <p className="text-muted text-xs uppercase font-bold" style={{ color: '#047857' }}>Cash</p>
                                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '700', color: '#064e3b' }}>₹ {stats.cashTotal.toLocaleString()}</h3>
                                </div>
                                {/* UPI */}
                                <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                    <p className="text-muted text-xs uppercase font-bold" style={{ color: '#1d4ed8' }}>UPI / GPay</p>
                                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '700', color: '#1e3a8a' }}>₹ {stats.upiTotal.toLocaleString()}</h3>
                                </div>
                                {/* Online Txn */}
                                <div style={{ padding: '1rem', background: '#e0f2fe', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                    <p className="text-muted text-xs uppercase font-bold" style={{ color: '#0284c7' }}>Online Txn</p>
                                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '700', color: '#0c4a6e' }}>₹ {stats.onlineTxnTotal.toLocaleString()}</h3>
                                </div>
                                {/* Money Order */}
                                <div style={{ padding: '1rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                    <p className="text-muted text-xs uppercase font-bold" style={{ color: '#c2410c' }}>Money Order</p>
                                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '700', color: '#7c2d12' }}>₹ {stats.moneyOrderTotal.toLocaleString()}</h3>
                                </div>
                            </div>

                            {/* Breakdown Table */}
                            {stats.paymentBreakdown && Object.keys(stats.paymentBreakdown).length > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>Payment Breakdown (Today)</h4>
                                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="text-left p-2">Type</th>
                                                    <th className="text-right p-2">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(stats.paymentBreakdown).map(([type, val]) => (
                                                    <tr key={type} className="border-t border-gray-100">
                                                        <td className="p-2 text-muted font-medium">{type}</td>
                                                        <td className="p-2 text-right font-bold">₹ {val.total.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Stats Grid */}
            <h3 className="text-xl font-bold mb-4 mt-8">System Stats</h3>
            <div className="grid grid-auto-fit">
                <div className="card card--light">
                    <Shield size={32} className="stat-icon muted" />
                    <p className="text-muted text-sm">Currently Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{stats.onlineUsers}</p>
                    <p className="text-xs text-muted">Total Reg. Users: {stats.activeUsers}</p>
                </div>
                <div className="card card--light">
                    <FileText size={32} className="stat-icon" />
                    <p className="text-muted text-sm">Active Receipts</p>
                    <p className="text-2xl font-bold">{stats.totalReceipts}</p>
                </div>
                <div className="card card--danger">
                    <Trash2 size={32} className="stat-icon" />
                    <p className="text-muted text-sm">Deleted Receipts (Audit)</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--danger-color)' }}>{stats.deletedReceipts}</p>
                </div>
            </div>

            {/* Quick Links for Admin */}
            <div className="card card--light">
                <h3 style={{ marginBottom: '1rem' }}>Master Management</h3>
                <div className="flex" style={{ gap: '1rem' }}>
                    <Link to="/manager/vazhipads" className="btn-primary">Manage Vazhipads</Link>
                    <Link to="/manager/staff" className="btn-secondary btn-secondary--dark">Manage All Staff</Link>
                </div>
            </div>
        </div >
    );
};

export default AdminDashboard;
