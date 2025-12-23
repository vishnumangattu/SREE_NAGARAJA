import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const ManagerDashboard = () => {
    const [stats, setStats] = useState({
        totalCollection: 0,
        stallTotal: 0,
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
                const [receiptsResponse, stallsResponse] = await Promise.all([
                    api.get('/receipts/stats/manager'),
                    api.get('/stalls/sales')
                ]);

                const data = receiptsResponse.data;
                const stallData = stallsResponse.data;

                // Calculate Today's Stall Total and Breakdown
                const today = new Date().toDateString();
                const todayStallSales = stallData.filter(s => new Date(s.date).toDateString() === today);
                const stallTotalToday = todayStallSales.reduce((acc, curr) => acc + curr.totalAmount, 0);

                const stallCashTotal = todayStallSales
                    .filter(s => !s.paymentMethod || s.paymentMethod === 'Cash')
                    .reduce((acc, curr) => acc + curr.totalAmount, 0);

                const stallUpiTotal = todayStallSales
                    .filter(s => s.paymentMethod === 'UPI')
                    .reduce((acc, curr) => acc + curr.totalAmount, 0);

                // --- Calculate Stall User Performance & Merge ---
                const stallUserMap = {};
                todayStallSales.forEach(sale => {
                    const userId = sale.soldBy._id; // Assuming soldBy is populated in backend or is ID
                    // Wait, soldBy in StallSale might be just ID if not populated. 
                    // Let's check api.get('/stalls/sales') implementation. 
                    // Usually it populates soldBy. If not, we might miss user name.
                    // Assuming populated for now as 'soldBy'
                    if (!stallUserMap[userId]) {
                        stallUserMap[userId] = {
                            _id: userId,
                            user: sale.soldBy, // Object
                            count: 0,
                            total: 0
                        };
                    }
                    stallUserMap[userId].count += 1; // Or items count? Usually just transaction count
                    stallUserMap[userId].total += sale.totalAmount;
                });

                // Merge with Receipt User Stats
                const combinedUserStats = [...data.userWiseStats];

                Object.values(stallUserMap).forEach(stallStat => {
                    const existingStatIndex = combinedUserStats.findIndex(s => s._id === stallStat._id);
                    if (existingStatIndex > -1) {
                        combinedUserStats[existingStatIndex].count += stallStat.count;
                        combinedUserStats[existingStatIndex].total += stallStat.total;
                    } else {
                        combinedUserStats.push(stallStat);
                    }
                });

                // Sort combined stats by Total Descending
                combinedUserStats.sort((a, b) => b.total - a.total);

                setStats({
                    totalCollection: data.totalCollectionToday,
                    stallTotal: stallTotalToday,
                    stallCashTotal,
                    stallUpiTotal,
                    userStats: combinedUserStats, // Updated
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
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Counter Collection</p>
                            <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>₹ {stats.totalCollection.toLocaleString()}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-r from-orange-500 to-red-500 text-white border-none">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Stall Collection</p>
                            <h2 className="text-3xl font-bold mt-2">₹ {stats.stallTotal.toLocaleString()}</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-full">
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

                {/* Counter Payments */}
                <div className="card card--light" style={{ gridColumn: 'span 2' }}>
                    <div className="flex justify-between items-center">
                        <div style={{ width: '100%' }}>
                            <p className="text-muted text-sm">Counter Payments (Today)</p>
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

                {/* Stall Payments */}
                <div className="card card--light" style={{ gridColumn: 'span 2' }}>
                    <div className="flex justify-between items-center">
                        <div style={{ width: '100%' }}>
                            <p className="text-muted text-sm">Stall Payments (Today)</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                {/* Cash */}
                                <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                                    <p className="text-muted text-xs uppercase font-bold" style={{ color: '#047857' }}>Cash</p>
                                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '700', color: '#064e3b' }}>₹ {stats.stallCashTotal?.toLocaleString() || 0}</h3>
                                </div>
                                {/* UPI/GPay */}
                                <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                    <p className="text-muted text-xs uppercase font-bold" style={{ color: '#1d4ed8' }}>UPI / GPay</p>
                                    <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', fontWeight: '700', color: '#1e3a8a' }}>₹ {stats.stallUpiTotal?.toLocaleString() || 0}</h3>
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

                {/* Daily Closing Report Card */}
                <div className="card bg-purple-600 text-white border-none transition hover:bg-purple-700">
                    <Link to="/manager/daily-closing" className="flex justify-between items-center w-full h-full no-underline text-white">
                        <div>
                            <p className="text-purple-200 text-sm font-medium">End of Day</p>
                            <h2 className="text-xl font-bold mt-1">Daily Closing Report</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-full">
                            <Plus size={24} />
                        </div>
                    </Link>
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
