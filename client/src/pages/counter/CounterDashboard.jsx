import { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext'; // Import AuthContext
import { Plus, List, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const CounterDashboard = () => {
    const { user } = useContext(AuthContext);
    const [receipts, setReceipts] = useState([]);
    const [stats, setStats] = useState({ count: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipts = async () => {
            try {
                const { data } = await api.get('/receipts');
                setReceipts(data);
                // Client side calculation for today's stats for immediate feedback
                const today = new Date().toDateString();
                const todayReceipts = data.filter(r => new Date(r.date).toDateString() === today);

                setStats({
                    count: todayReceipts.length,
                    total: todayReceipts.reduce((acc, curr) => acc + curr.totalAmount, 0)
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching receipts", error);
                setLoading(false);
            }
        };

        fetchReceipts();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Counter Dashboard</h1>
                    <p className="text-muted">Welcome back, {user?.name}</p>
                </div>
                <Link to="/counter/create" className="btn-primary">
                    <Plus size={20} /> New Receipt
                </Link>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Receipts Today</p>
                            <h2 style={{ fontSize: '2rem', color: 'white' }}>{stats.count}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                            <List size={24} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white' }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>Collection Today</p>
                            <h2 style={{ fontSize: '2rem', color: 'white' }}>₹ {stats.total.toLocaleString()}</h2>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '50%' }}>
                            <CreditCard size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Receipts Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fcfcfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>Recent Receipts</h2>
                    <Link to="/counter/history" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', fontWeight: 500 }}>View All History</Link>
                </div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Issued Date</th>
                                <th>Vazhipadu Date</th>
                                <th>Vazhipad</th>
                                <th>Person (Main)</th>
                                <th>Count</th>
                                <th className="text-right">Amount</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receipts.slice(0, 10).map((receipt) => (
                                <tr key={receipt._id}>
                                    <td style={{ fontFamily: 'monospace' }}>#{receipt.receiptNumber}</td>
                                    <td>{new Date(receipt.createdAt).toLocaleDateString('en-GB').split('/').join('-')}</td>
                                    <td>{new Date(receipt.date).toLocaleDateString('en-GB').split('/').join('-')}</td>
                                    <td>{receipt.vazhipaduType || receipt.vazhipadu}</td>
                                    <td>{receipt.items[0]?.name || '-'}</td>
                                    <td>{receipt.items.length}</td>
                                    <td className="text-right font-bold">₹ {receipt.totalAmount}</td>
                                    <td className="text-center">
                                        <Link to={`/counter/receipts/${receipt._id}`} className="text-sm" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {receipts.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted" style={{ padding: '2rem' }}>No receipts generated yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CounterDashboard;
