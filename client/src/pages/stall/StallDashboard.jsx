import { useState, useEffect, useRef } from 'react';
import { Edit2, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';

const StallDashboard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [remarks, setRemarks] = useState("");
    const amountInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [todayTotal, setTodayTotal] = useState(0);

    useEffect(() => {
        loadDashboardData();
    }, [id]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await fetchDailySalesAndTotal();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailySalesAndTotal = async () => {
        try {
            const { data } = await api.get('/stalls/sales');
            const today = new Date().toDateString();

            // Filter for Today's sales
            const todaySales = data.filter(s => new Date(s.date).toDateString() === today);

            // Sort by date ascending to calculate running totals
            const sortedByTimeAsc = [...todaySales].sort((a, b) => new Date(a.date) - new Date(b.date));

            let runningTotal = 0;
            const processedRows = sortedByTimeAsc.map((sale, index) => {
                runningTotal += sale.totalAmount;
                const itemNames = sale.items.map(i => i.name === 'Stall Entry' ? '' : i.name).filter(Boolean).join(', ');

                return {
                    id: sale._id, // Real Backend ID
                    displayId: index + 1,
                    amount: sale.totalAmount,
                    remarks: itemNames,
                    total: runningTotal,
                    paymentMethod: sale.paymentMethod || 'Cash', // Default for old data
                    edited: false,
                    locked: true,
                };
            });

            setRows(processedRows);
            setTodayTotal(runningTotal);

        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const handleAdd = async () => {
        if (!amount) return;

        const currentAmount = Number(amount);

        try {
            const payload = {
                items: [{
                    name: remarks || 'Stall Entry',
                    rate: currentAmount,
                    quantity: 1,
                    amount: currentAmount
                }],
                totalAmount: currentAmount,
                paymentMethod // 'Cash' or 'UPI'
            };

            await api.post('/stalls/sales', payload);

            setAmount("");
            setRemarks("");
            // Reset payment method to Cash? Or keep selection? Usually keep for speed.
            // setPaymentMethod('Cash'); 
            amountInputRef.current?.focus();

            await fetchDailySalesAndTotal();

        } catch (error) {
            console.error(error);
            alert("Failed to save entry");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleAdd();
        }
    };

    const handleEdit = (id) => {
        setRows(rows.map((r) => (r.id === id ? { ...r, locked: false } : r)));
    };

    const handleUpdate = async (id, newAmount, newRemarks) => {
        try {
            const numAmount = Number(newAmount);
            // Verify if we want to update payment method here too?
            // For now, let's assume inline edit keeps original payment method unless we add field.
            // Let's simpler keep it as is, or pass existing one.
            const row = rows.find(r => r.id === id);

            const payload = {
                items: [{
                    name: newRemarks || 'Stall Entry',
                    rate: numAmount,
                    quantity: 1,
                    amount: numAmount
                }],
                totalAmount: numAmount,
                paymentMethod: row.paymentMethod // Preserve original
            };

            await api.put(`/stalls/sales/${id}`, payload);

            await fetchDailySalesAndTotal();

        } catch (error) {
            console.error(error);
            alert("Failed to update entry");
        }
    };

    if (loading) return <div>Loading...</div>;

    // Render rows in reverse order (Newest First) per request
    const reversedRows = [...rows].reverse();

    return (
        <div className="max-w-4xl mx-auto">
            {/* Today's Total Card */}
            <div className="card bg-gradient-to-r from-orange-500 to-red-500 text-white mb-6 border-none shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-orange-100 text-sm font-medium mb-1">Today's Total Collection</p>
                        <h2 className="text-4xl font-bold">₹ {todayTotal.toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Stall Sheet
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Link to="/stall/history" className="btn-secondary">
                        History
                    </Link>
                </div>
            </div>

            {/* Input Area */}
            <div className="card mb-6 p-4 flex flex-col gap-4 bg-white shadow-sm border border-gray-100">
                <div className="flex gap-4 items-end">
                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Payment</label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="input-field w-full h-[42px]"
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">GPay</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                        <input
                            ref={amountInputRef}
                            type="number"
                            placeholder="Enter Amount"
                            value={amount}
                            className="input-field w-full text-lg"
                            onChange={(e) => setAmount(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Remarks (Optional)</label>
                        <input
                            type="text"
                            placeholder="Enter Remarks"
                            value={remarks}
                            className="input-field w-full"
                            onChange={(e) => setRemarks(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="btn-primary h-[42px] px-6"
                    >
                        Enter
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="card p-0 overflow-hidden shadow-sm border border-gray-100">
                <div className="table-container">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4 border-b">No</th>
                                <th className="p-4 border-b">Pay Mode</th>
                                <th className="p-4 border-b">Amount</th>
                                <th className="p-4 border-b">Remarks</th>
                                <th className="p-4 border-b text-right">Total</th>
                                <th className="p-4 border-b text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reversedRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-gray-500">{row.displayId}</td>

                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${row.paymentMethod === 'Cash'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {row.paymentMethod === 'UPI' ? 'GPay' : row.paymentMethod}
                                        </span>
                                    </td>

                                    <td className="p-4 font-bold text-gray-800">
                                        {row.locked ? (
                                            `₹ ${row.amount}`
                                        ) : (
                                            <input
                                                type="number"
                                                defaultValue={row.amount}
                                                id={`edit-amount-${row.id}`}
                                                className="input-field p-1 w-24 text-sm"
                                            />
                                        )}
                                    </td>

                                    <td className="p-4">
                                        {row.locked ? (
                                            <div className="flex items-center gap-2">
                                                <span>{row.remarks || '-'}</span>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                defaultValue={row.remarks}
                                                id={`edit-remarks-${row.id}`}
                                                className="input-field p-1 w-full text-sm"
                                            />
                                        )}
                                    </td>

                                    <td className="p-4 text-right font-mono font-bold text-blue-600">
                                        ₹ {row.total}
                                    </td>

                                    <td className="p-4 text-center">
                                        {row.locked ? (
                                            <button
                                                onClick={() => handleEdit(row.id)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleUpdate(
                                                        row.id,
                                                        document.getElementById(`edit-amount-${row.id}`).value,
                                                        document.getElementById(`edit-remarks-${row.id}`).value
                                                    )
                                                }
                                                className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 px-3 py-1 rounded border border-green-200"
                                            >
                                                Save
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reversedRows.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 italic">
                                        No entries yet. Start by adding an amount above.
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

export default StallDashboard;
