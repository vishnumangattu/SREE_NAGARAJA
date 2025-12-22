import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        totalCollection: 0,
        userStats: [],
        cashTotal: 0,
        upiTotal: 0,
        onlineTxnTotal: 0,
        moneyOrderTotal: 0,
        paymentBreakdown: {}
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/receipts/stats/manager');
                setStats({
                    totalCollection: data.totalCollectionToday,
                    userStats: data.userWiseStats,
                    cashTotal: data.cashTotal || 0,
                    upiTotal: data.upiTotal || 0,
                    onlineTxnTotal: data.onlineTxnTotal || 0,
                    moneyOrderTotal: data.moneyOrderTotal || 0,
                    paymentBreakdown: data.paymentBreakdown || {}
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching manager stats", error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 style={{ marginBottom: '1.5rem' }}>Manager Dashboard</h1>

            {/* Top Cards */}
            <div className="grid grid-auto-fit">
                <div className="card card--accent">
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Total Collection Today</p>
                            <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>₹ {stats.totalCollection.toLocaleString()}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="card card--accent">
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Active Counters</p>
                            <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', color: 'white' }}>{stats.userStats.length}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                            <Users size={24} />
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
                        </div>
                    </div>
                </div>

                <div className="card card--light">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-muted text-sm">Quick Actions</p>
                            <div className="space-x-4" style={{ marginTop: '0.75rem' }}>
                                <Link to="/manager/vazhipads" className="btn-secondary text-xs">Manage Vazhipads</Link>
                                <Link to="/manager/staff" className="btn-secondary text-xs">Manage Staff</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Wise Breakdown */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fcfcfc' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>User Performance (Today)</h2>
                </div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th className="text-center">Receipts Count</th>
                                <th className="text-right">Total Collection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.userStats.map((stat) => (
                                <tr key={stat._id}>
                                    <td className="font-bold">{stat.user.name}</td>
                                    <td className="text-center">{stat.count}</td>
                                    <td className="text-right font-bold" style={{ color: 'var(--secondary-color)' }}>
                                        ₹ {stat.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {stats.userStats.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center text-muted" style={{ padding: '2rem' }}>
                                        No activity recorded today.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
