import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, Calendar, Search, TrendingUp, DollarSign } from 'lucide-react';

const UserPerformance = () => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            // Filter to show staff primarily
            const staff = data.filter(u => u.role !== 'superadmin');
            setUsers(staff);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    const fetchPerformance = async () => {
        if (!selectedUser) {
            alert("Please select a user");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.get('/receipts/stats/user-performance', {
                params: {
                    userId: selectedUser,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                }
            });
            setStats(data);
        } catch (error) {
            console.error("Error fetching performance", error);
            alert("Failed to fetch performance stats");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1a202c', marginBottom: '0.5rem' }}>Staff Performance Review</h1>
                <p style={{ color: '#718096' }}>Analyze individual staff collection and activity.</p>
            </div>

            {/* Filter Section */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                marginBottom: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                alignItems: 'end'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>Select Staff Member</label>
                    <div style={{ position: 'relative' }}>
                        <Users size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: '#f8fafc'
                            }}
                        >
                            <option value="">-- Choose User --</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>Start Date</label>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: '#f8fafc'
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' }}>End Date</label>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }} />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem',
                                outline: 'none',
                                background: '#f8fafc'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex' }}>
                    <button
                        onClick={fetchPerformance}
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Loading...' : <><Search size={18} /> View Performance</>}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                    {/* Main Stats */}
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '1.5rem', color: 'white', gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collection</h3>
                                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '0.5rem' }}>₹ {stats.totalAmount.toLocaleString()}</div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px', marginTop: '1rem', fontSize: '0.85rem' }}>
                                    <TrendingUp size={14} style={{ marginRight: '0.5rem' }} /> {stats.count} Receipts Generated
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '50%' }}>
                                <DollarSign size={48} color="#4ade80" />
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Cards */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Cash Collected</h4>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#022c22' }}>₹ {stats.cashTotal.toLocaleString()}</div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>UPI / GPay</h4>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e3a8a' }}>₹ {stats.upiTotal.toLocaleString()}</div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ color: '#0891b2', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Online Transaction</h4>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#155e75' }}>₹ {stats.onlineTotal?.toLocaleString() || 0}</div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ color: '#ea580c', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Money Order</h4>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#7c2d12' }}>₹ {stats.moneyOrderTotal?.toLocaleString() || 0}</div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default UserPerformance;
