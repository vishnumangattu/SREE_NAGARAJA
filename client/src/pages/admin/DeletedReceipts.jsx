import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trash2 } from 'lucide-react';

const DeletedReceipts = () => {
    const [deletedItems, setDeletedItems] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Loading logs...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trash2 /> Deleted Receipts Log
            </h1>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', backgroundColor: '#fcfcfc', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>Audit Log</h2>
                </div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Receipt #</th>
                                <th>Amount</th>
                                <th>Payment Type</th>
                                <th>Printed By</th>
                                <th>Deleted At</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedItems.map((item) => (
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
                            {deletedItems.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted p-8">No deleted receipts found.</td>
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
