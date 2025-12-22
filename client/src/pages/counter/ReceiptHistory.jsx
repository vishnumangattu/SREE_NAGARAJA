import { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Edit2, Save, X, Check } from 'lucide-react';

import { nakshatraList } from '../../utils/constants';

const ReceiptHistory = () => {
    const { user } = useContext(AuthContext);
    const [receipts, setReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // ... (filters state) ...

    // Filters
    const [filters, setFilters] = useState({
        name: "",
        nakshatram: "",
        vazhipadu: "",
        date: "",
        paymentType: "" // '', 'Cash', 'GPay', etc.
    });

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        try {
            const { data } = await api.get('/receipts');
            setReceipts(data);
            setFilteredReceipts(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching receipts", error);
            setLoading(false);
        }
    };

    // Handle Filter Change
    useEffect(() => {
        let result = receipts;
        if (filters.name) result = result.filter(r => r.items.some(item => item.name.toLowerCase().includes(filters.name.toLowerCase())));
        if (filters.nakshatram) result = result.filter(r => r.items.some(item => item.nakshatram?.toLowerCase().includes(filters.nakshatram.toLowerCase())));
        if (filters.vazhipadu) result = result.filter(r => (r.vazhipaduType && r.vazhipaduType.toLowerCase().includes(filters.vazhipadu.toLowerCase())) || (r.vazhipadu && r.vazhipadu.toLowerCase().includes(filters.vazhipadu.toLowerCase())));
        if (filters.date) result = result.filter(r => r.date.startsWith(filters.date));
        if (filters.paymentType) result = result.filter(r => r.paymentType === filters.paymentType);
        setFilteredReceipts(result);
    }, [filters, receipts]);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    // Edit Logic
    const startEdit = (receipt, itemIndex) => {
        setEditingId(`${receipt._id}-${itemIndex}`);
        setEditForm({
            date: (receipt.vazhipaduDate || receipt.date).split('T')[0],
            vazhipadu: receipt.vazhipaduType || receipt.vazhipadu,
            name: receipt.items[itemIndex]?.name || '',
            nakshatram: receipt.items[itemIndex]?.nakshatram || '',
            amount: receipt.totalAmount, // This is total, not item amount. 
            paymentType: receipt.paymentType || 'Cash'
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (id, itemIndex) => {
        try {
            const original = receipts.find(r => r._id === id);

            // Validate Nakshatram
            let finalNakshatram = editForm.nakshatram;
            if (finalNakshatram) {
                const match = nakshatraList.find(n =>
                    n.en.toLowerCase().startsWith(finalNakshatram.toLowerCase()) ||
                    n.ml.toLowerCase().startsWith(finalNakshatram.toLowerCase()) ||
                    n.ml === finalNakshatram
                );
                if (match) finalNakshatram = match.ml;
            }

            const updatedItems = [...original.items];
            if (updatedItems[itemIndex]) {
                updatedItems[itemIndex] = { ...updatedItems[itemIndex], name: editForm.name, nakshatram: finalNakshatram };
            }

            const payload = {
                ...original,
                vazhipadu: editForm.vazhipadu,
                vazhipaddate: editForm.date,
                paymentType: editForm.paymentType,
                items: updatedItems,
            };

            await api.put(`/receipts/${id}`, payload);

            alert('Receipt updated!');
            setEditingId(null);
            fetchReceipts();
        } catch (error) {
            console.error("Update failed", error);
            alert("Update failed");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Receipt History</h1>
                    <p className="text-muted">View and search all past receipts</p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Search Filters</h3>
                <div className="grid grid-auto-fit" style={{ alignItems: 'start' }}>
                    <div>
                        <label className="block" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Name</label>
                        <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search by Name" className="input-field" />
                    </div>
                    <div>
                        <label className="block" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nakshatram</label>
                        <input type="text" name="nakshatram" value={filters.nakshatram} onChange={handleFilterChange} placeholder="Search by Nakshatram" className="input-field" />
                    </div>
                    <div>
                        <label className="block" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Vazhipadu</label>
                        <input type="text" name="vazhipadu" value={filters.vazhipadu} onChange={handleFilterChange} placeholder="Search by Vazhipadu" className="input-field" />
                    </div>
                    <div>
                        <label className="block" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Vazhipadu Date</label>
                        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="input-field" />
                    </div>
                    <div>
                        <label className="block" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Payment Type</label>
                        <select name="paymentType" value={filters.paymentType} onChange={handleFilterChange} className="input-field">
                            <option value="">All</option>
                            <option value="Cash">Cash</option>
                            <option value="GPay">GPay</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Filtered Receipts Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fcfcfc' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>Receipt List ({filteredReceipts.flatMap(r => r.items).length} Items)</h2>
                </div>
                <datalist id="nakshatra-options">
                    {nakshatraList.map(n => (
                        <option key={n.en} value={n.en}>{n.ml}</option>
                    ))}
                </datalist>
                <div className="table-container table-scroll" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Issued Date</th>
                                <th>Vazhipadu Date</th>
                                <th>Vazhipad</th>
                                <th>Person</th>
                                <th>Nakshatram</th>
                                <th>Payment</th>
                                <th className="text-right">Amount</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReceipts.flatMap(receipt =>
                                receipt.items.map((item, index) => ({ ...receipt, itemData: item, itemIndex: index }))
                            ).map((row) => {
                                const rowKey = `${row._id}-${row.itemIndex}`;
                                const isEditing = editingId === rowKey;

                                return (
                                    <tr key={rowKey} className={row.itemIndex > 0 ? "border-t-0" : ""}>
                                        <td style={{ fontFamily: 'monospace' }}>
                                            #{row.receiptNumber}
                                        </td>
                                        <td>
                                            {new Date(row.createdAt).toLocaleDateString('en-GB').split('/').join('-')}
                                        </td>

                                        {/* Editable: Vazhipadu Date (Shared) */}
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editForm.date}
                                                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                                    className="p-1 border rounded w-full"
                                                />
                                            ) : (
                                                Array.isArray(row.vazhipaduDate)
                                                    ? (row.vazhipaduDate.length > 1
                                                        ? `${new Date(row.vazhipaduDate[0]).toLocaleDateString('en-GB')} (+${row.vazhipaduDate.length - 1})`
                                                        : new Date(row.vazhipaduDate[0]).toLocaleDateString('en-GB'))
                                                    : new Date(row.vazhipaduDate || row.date).toLocaleDateString("en-GB")
                                            )}
                                        </td>

                                        {/* Vazhipadu Name (Shared) */}
                                        <td title={row.vazhipaduType || row.vazhipadu}>
                                            {row.vazhipaduType || row.vazhipadu}
                                        </td>

                                        {/* Editable: Person Name (Specific) */}
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="p-1 border rounded w-full"
                                                />
                                            ) : (
                                                row.itemData.name
                                            )}
                                        </td>

                                        {/* Editable: Nakshatram (Specific) */}
                                        <td>
                                            {isEditing ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editForm.nakshatram}
                                                        onChange={e => setEditForm({ ...editForm, nakshatram: e.target.value })}
                                                        onBlur={() => {
                                                            const v = (editForm.nakshatram || '').toLowerCase().trim();
                                                            const match = nakshatraList.find(n => n.en === v || n.en.startsWith(v) || n.ml.toLowerCase() === v || n.ml.toLowerCase().startsWith(v));
                                                            if (match) setEditForm(prev => ({ ...prev, nakshatram: match.en }));
                                                        }}
                                                        list="nakshatra-options"
                                                        className="p-1 border rounded w-full"
                                                    />
                                                </>
                                            ) : (
                                                row.itemData.nakshatram || '-'
                                            )}
                                        </td>

                                        {/* Editable: Payment (Shared) */}
                                        <td>
                                            {isEditing ? (
                                                <select value={editForm.paymentType} onChange={e => setEditForm({ ...editForm, paymentType: e.target.value })} className="p-1 border rounded w-full">
                                                    <option value="Cash">Cash</option>
                                                    <option value="GPay">GPay</option>
                                                </select>
                                            ) : (
                                                // Only show payment on first row to reduce clutter? Or all? User said "each person as data", so show all.
                                                row.paymentType || '-'
                                            )}
                                        </td>

                                        <td className="text-right font-bold">₹ {row.itemData.amount}</td>

                                        <td className="text-center">
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => saveEdit(row._id, row.itemIndex)} className="text-green-600 hover:text-green-800" title="Save" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700" title="Cancel" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link to={`/counter/receipts/${row._id}?idx=${row.itemIndex}`} className="text-sm" style={{ color: 'var(--secondary-color)', textDecoration: 'none', fontWeight: 500 }}>
                                                            View
                                                        </Link>
                                                        <button onClick={() => startEdit(row, row.itemIndex)} className="text-sm" style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                                                            Edit
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default ReceiptHistory;
