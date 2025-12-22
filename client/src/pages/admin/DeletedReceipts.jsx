import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trash2 } from 'lucide-react';

const DeletedReceipts = () => {
    const [deletedItems, setDeletedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const fetchDeleted = async () => {
            try {
                const { data } = await api.get('/receipts?deleted=true');
                setDeletedItems(data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch deleted receipts", error);
                setLoading(false);
            }
        };
        fetchDeleted();
    }, []);

    const filteredItems = filterDate
        ? deletedItems.filter(item => item.deletedAt && item.deletedAt.startsWith(filterDate))
        : deletedItems;

    if (loading) return <div>Loading logs...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Trash2 /> Deleted Receipts Log
                </h1>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Filter by Date:</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="p-2 border rounded"
                    />
                    {filterDate && (
                        <button
                            onClick={() => setFilterDate('')}
                            className="text-sm text-red-500 hover:text-red-700"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fcfcfc', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>Audit Log ({filteredItems.length} found)</h2>
                </div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Receipt #</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Payment Type</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Printed By</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Deleted At</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => (
                                <tr key={item._id} className="row-deleted">
                                    <td style={{ fontFamily: 'monospace' }}>#{item.receiptNumber}</td>
                                    <td className="font-bold">₹ {item.totalAmount}</td>
                                    <td>
                                        <span className={`badge text-xs ${item.paymentType === 'GPay' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {item.paymentType || 'Cash'}
                                        </span>
                                    </td>
                                    <td className="text-sm">{item.createdBy?.name || 'Unknown'}</td>
                                    <td className="text-sm">{new Date(item.deletedAt).toLocaleString()}</td>
                                    <td className="text-sm text-muted italic">"{item.deleteReason}"</td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted p-8">No deleted receipts found for this selection.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeletedReceipts;
