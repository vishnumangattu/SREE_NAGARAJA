import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, ShoppingCart, History, Save, Trash2 } from 'lucide-react';

const StallDashboard = () => {
    const [sales, setSales] = useState([]);
    const [totalToday, setTotalToday] = useState(0);
    const [items, setItems] = useState([{ id: Date.now(), name: '', rate: 0, quantity: 1, amount: 0 }]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const { data } = await api.get('/stalls/sales');
            setSales(data);

            const today = new Date().toDateString();
            const todaySales = data.filter(s => new Date(s.date).toDateString() === today);
            const total = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
            setTotalToday(total);

            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleItemChange = (id, field, value) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                let updates = { [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    const qty = field === 'quantity' ? value : item.quantity;
                    const rt = field === 'rate' ? value : item.rate;
                    updates.amount = qty * rt;
                }
                return { ...item, ...updates };
            }
            return item;
        });
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: '', rate: 0, quantity: 1, amount: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const calculateTotal = () => items.reduce((acc, curr) => acc + curr.amount, 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                items: items.map(({ name, rate, quantity, amount }) => ({ name, rate, quantity, amount })),
                totalAmount: calculateTotal()
            };
            await api.post('/stalls/sales', payload);
            alert('Sale Recorded!');
            setItems([{ id: Date.now(), name: '', rate: 0, quantity: 1, amount: 0 }]);
            fetchSales();
        } catch (error) {
            alert('Failed to record sale');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Sales Entry */}
            <div style={{ gridColumn: 'span 2' }}>
                <h1 style={{ marginBottom: '1.5rem' }}>New Sale Entry</h1>
                <form onSubmit={handleSubmit} className="card space-y-4">
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                                <div style={{ flex: 3 }}>
                                    <label className="text-xs font-bold text-muted mb-1 block">Item Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={item.name}
                                        onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-xs font-bold text-muted mb-1 block">Rate</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={item.rate}
                                        onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="text-xs font-bold text-muted mb-1 block">Qty</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                                <div style={{ flex: 1, textAlign: 'right', paddingBottom: '0.5rem' }}>
                                    <p className="font-bold">₹ {item.amount}</p>
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="text-danger"
                                        style={{ marginBottom: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addItem} className="text-sm flex items-center" style={{ color: 'var(--secondary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        <Plus size={16} style={{ marginRight: '0.25rem' }} /> Add More Items
                    </button>

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total: ₹ {calculateTotal()}</div>
                        <button type="submit" className="btn-primary flex items-center">
                            <Save size={16} style={{ marginRight: '0.5rem' }} /> Record Sale
                        </button>
                    </div>
                </form>

                {/* Recent Sales List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '1rem' }}>Recent Sales History</h2>
                    </div>
                    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Items</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.slice(0, 10).map((sale) => (
                                    <tr key={sale._id}>
                                        <td className="text-sm text-muted">
                                            {new Date(sale.date).toLocaleTimeString()}
                                        </td>
                                        <td className="text-sm">
                                            {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                        </td>
                                        <td className="text-right font-bold">
                                            ₹ {sale.totalAmount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sidebar Stats */}
            <div>
                <div className="card" style={{ background: 'linear-gradient(to bottom right, #fb923c, #ea580c)', color: 'white', border: 'none' }}>
                    <p style={{ color: '#ffedd5', fontSize: '0.875rem' }}>Today's Total Sales</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0' }}>₹ {totalToday.toLocaleString()}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#ffedd5', fontSize: '0.875rem' }}>
                        <ShoppingCart size={16} style={{ marginRight: '0.5rem' }} />
                        <span>{sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length} Transactions</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StallDashboard;
