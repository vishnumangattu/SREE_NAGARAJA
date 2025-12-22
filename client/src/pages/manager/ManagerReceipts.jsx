import { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Save, X, Check, Filter } from 'lucide-react';
import { nakshatraList } from '../../utils/constants';

const ManagerReceipts = () => {
    const { user } = useContext(AuthContext);
    const [receipts, setReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [users, setUsers] = useState([]); // For Staff Filter
    const [vazhipads, setVazhipads] = useState([]); // For Edit Dropdown
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Filters
    const [filters, setFilters] = useState({
        name: "",
        nakshatram: "",
        vazhipadu: "",
        date: "",
        paymentType: "",
        staffId: "" // New Filter
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [receiptsRes, usersRes, vazhipadsRes] = await Promise.all([
                api.get('/receipts'), // Manager gets all non-deleted by default
                api.get('/users'),     // Fetch staff list
                api.get('/vazhipads')  // Fetch vazhipads for edit
            ]);
            setReceipts(receiptsRes.data);
            setFilteredReceipts(receiptsRes.data);
            setUsers(usersRes.data);
            setVazhipads(vazhipadsRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data", error);
            setLoading(false);
        }
    };

    // Handle Filter Change
    useEffect(() => {
        let result = receipts;

        // Filter by Staff (Created By)
        if (filters.staffId) {
            result = result.filter(r => r.createdBy && r.createdBy._id === filters.staffId);
        }

        if (filters.name) result = result.filter(r => r.items.some(item => item.name.toLowerCase().includes(filters.name.toLowerCase())));
        if (filters.nakshatram) result = result.filter(r => r.items.some(item => item.nakshatram?.toLowerCase().includes(filters.nakshatram.toLowerCase())));
        if (filters.vazhipadu) result = result.filter(r => (r.vazhipaduType && r.vazhipaduType.toLowerCase().includes(filters.vazhipadu.toLowerCase())) || (r.vazhipadu && r.vazhipadu.toLowerCase().includes(filters.vazhipadu.toLowerCase())));
        if (filters.date) result = result.filter(r => r.date.startsWith(filters.date));
        if (filters.paymentType) result = result.filter(r => r.paymentType === filters.paymentType);

        setFilteredReceipts(result);
    }, [filters, receipts]);

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    // Edit Logic (Same as ReceiptHistory)
    const startEdit = (receipt, itemIndex) => {
        setEditingId(`${receipt._id}-${itemIndex}`);
        const item = receipt.items[itemIndex];
        setEditForm({
            date: receipt.date.split('T')[0],
            vazhipaduDate: (receipt.vazhipaduDate || receipt.date).split('T')[0],
            vazhipadu: receipt.vazhipaduType || receipt.vazhipadu, // Display Name or Code
            vazhipaduCode: receipt.vazhipadu, // Keep track of code
            name: item?.name || '',
            nakshatram: item?.nakshatram || '',
            paymentType: receipt.paymentType || 'Cash',
            count: item?.count || 1,
            rate: item?.rate || 0,
            amount: item?.amount || 0
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleVazhipaduChange = (e) => {
        const newValue = e.target.value; // Name or ID from select
        // Find selected vazhipad
        const selected = vazhipads.find(v => v.name === newValue || v.code === newValue);

        if (selected) {
            setEditForm(prev => ({
                ...prev,
                vazhipadu: selected.name,
                vazhipaduCode: selected.code,
                rate: selected.rate,
                amount: selected.rate * prev.count // Recalculate Amount
            }));
        } else {
            setEditForm(prev => ({ ...prev, vazhipadu: newValue }));
        }
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
                updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    name: editForm.name,
                    nakshatram: finalNakshatram,
                    // Update Rate and Amount if Vazhipad Changed
                    rate: editForm.rate,
                    amount: editForm.amount
                };
            }

            const payload = {
                ...original,
                vazhipadu: editForm.vazhipaduCode, // Send Code
                vazhipaduType: editForm.vazhipadu, // Send Name
                vazhipaddate: editForm.vazhipaduDate,
                currentdate: editForm.date, // Read-only in UI, but sent back
                paymentType: editForm.paymentType,
                items: updatedItems,
            };

            await api.put(`/receipts/${id}`, payload);
            alert('Receipt updated!');
            setEditingId(null);
            fetchData(); // Refresh all
        } catch (error) {
            console.error("Update failed", error);
            alert("Update failed: " + (error.response?.data?.message || error.message));
        }
    };

    // Delete Logic (Soft Delete)
    const handleDelete = async (id) => {
        const reason = prompt("Enter a reason for deletion (Optional):");
        if (reason === null) return; // Cancelled

        try {
            await api.delete(`/receipts/${id}`, { data: { reason } });
            alert("Receipt deleted");
            fetchData();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete receipt");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Manager Receipts</h1>
                    <p className="text-muted">Manage all receipts (Edit, Delete, Filter)</p>
                </div>
            </div>

            {/* Filter Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} /> Filters
                </h3>
                <div className="grid grid-auto-fit" style={{ alignItems: 'start' }}>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Staff Member</label>
                        <select name="staffId" value={filters.staffId} onChange={handleFilterChange} className="input-field">
                            <option value="">All Staff</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Name</label>
                        <input type="text" name="name" value={filters.name} onChange={handleFilterChange} placeholder="Search Name" className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Nakshatram</label>
                        <input type="text" name="nakshatram" value={filters.nakshatram} onChange={handleFilterChange} placeholder="Search Star" className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Vazhipadu</label>
                        <input type="text" name="vazhipadu" value={filters.vazhipadu} onChange={handleFilterChange} placeholder="Search Vazhipadu" className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Date</label>
                        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="input-field" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Payment</label>
                        <select name="paymentType" value={filters.paymentType} onChange={handleFilterChange} className="input-field">
                            <option value="">All</option>
                            <option value="Cash">Cash</option>
                            <option value="GPay">GPay</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Receipts Table */}
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
                                <th>Receipt Date</th>
                                <th>Vazhipad Date</th>
                                <th>Created By</th>
                                <th>Vazhipadu</th>
                                <th>Person</th>
                                <th>Nakshatram</th>
                                <th>Payment Type</th>
                                <th>Amt</th>
                                <th className="text-center">Actions</th>
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
                                        <td className="font-mono text-muted">#{row.receiptNumber}</td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editForm.date}
                                                    readOnly // Read-Only as requested
                                                    className="p-1 border rounded w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                                                />
                                            ) : (
                                                new Date(row.date).toLocaleDateString('en-GB')
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editForm.vazhipaduDate}
                                                    onChange={e => setEditForm({ ...editForm, vazhipaduDate: e.target.value })}
                                                    className="p-1 border rounded w-full"
                                                />
                                            ) : (
                                                <span className="font-semibold">
                                                    {new Date(row.vazhipaduDate || row.date).toLocaleDateString('en-GB')}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="text-xs badge" style={{ background: '#f3f4f6' }}>
                                                {row.createdBy?.name || 'Unknown'}
                                            </span>
                                        </td>

                                        {/* Vazhipadu - Editable via Dropdown */}
                                        <td title={row.vazhipaduType || row.vazhipadu}>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.vazhipadu}
                                                    onChange={handleVazhipaduChange}
                                                    className="p-1 border rounded w-full"
                                                >
                                                    {vazhipads.map(v => (
                                                        <option key={v._id} value={v.name}>{v.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                row.vazhipaduType || row.vazhipadu
                                            )}
                                        </td>

                                        {/* Editable: Person Name */}
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

                                        {/* Editable: Nakshatram */}
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.nakshatram}
                                                    onChange={e => setEditForm({ ...editForm, nakshatram: e.target.value })}
                                                    list="nakshatra-options"
                                                    className="p-1 border rounded w-full"
                                                />
                                            ) : (
                                                row.itemData.nakshatram || '-'
                                            )}
                                        </td>

                                        {/* Editable: Payment Type */}
                                        <td>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.paymentType}
                                                    onChange={e => setEditForm({ ...editForm, paymentType: e.target.value })}
                                                    className="p-1 border rounded w-full"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="GPay">GPay</option>
                                                </select>
                                            ) : (
                                                <span className={`badge ${row.paymentType === 'GPay' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {row.paymentType || 'Cash'}
                                                </span>
                                            )}
                                        </td>

                                        <td className="font-bold">
                                            {isEditing ? `₹ ${editForm.amount}` : `₹ ${row.itemData.amount}`}
                                        </td>

                                        <td className="text-center">
                                            <div className="flex justify-center" style={{ gap: '10px' }}>
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => saveEdit(row._id, row.itemIndex)} className="text-green-600 hover:text-green-800" title="Save">
                                                            <Check size={18} />
                                                        </button>
                                                        <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700" title="Cancel">
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(row, row.itemIndex)} className="action-edit" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(row._id)} className="action-delete" title="Delete Entire Receipt">
                                                            <Trash2 size={16} />
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

export default ManagerReceipts;
