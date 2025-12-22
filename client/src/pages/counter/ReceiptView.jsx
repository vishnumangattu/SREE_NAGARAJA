import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import './temple.css';

const ReceiptView = () => {
    const { id } = useParams();
    const location = useLocation();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get item index from query params
    const query = new URLSearchParams(location.search);
    const itemIdxStr = query.get('idx');
    const itemIdx = itemIdxStr !== null ? parseInt(itemIdxStr) : null;

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const { data } = await api.get(`/receipts/${id}`);
                setReceipt(data);
                setLoading(false);
            } catch (error) {
                console.error("Error", error);
                setLoading(false);
            }
        };
        fetchReceipt();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div>Loading Receipt...</div>;
    if (!receipt) return <div>Receipt not found</div>;

    // Filter items if index is provided
    let displayItems = [];
    let displayTotal = 0;

    // Calculate Grand Total for Recurring (if recurrenceDates exists and has length > 1)
    const isRecurring = receipt && receipt.recurrenceDates && receipt.recurrenceDates.length > 1;
    let grandTotalMultiplier = isRecurring ? receipt.recurrenceDates.length : 1;

    if (receipt && receipt.items && Array.isArray(receipt.items)) {
        if (itemIdx !== null && itemIdx >= 0 && itemIdx < receipt.items.length) {
            displayItems = [receipt.items[itemIdx]];
        } else {
            displayItems = receipt.items;
        }

        // Calculate display total (Sum of items * recurrences)
        // Note: receipt.items.amount is PER DAY (stored in DB). We need to multiply by dates for Grand Total on Receipt.
        displayTotal = displayItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0) * grandTotalMultiplier;
    }

    return (
        <div className="container">
            {/* No Print Header */}
            <div className="no-print flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <Link to="/counter/history" className="btn-secondary flex items-center">
                        <ArrowLeft size={16} className="mr-2" /> Back to History
                    </Link>
                    {itemIdx !== null && (
                        <Link to={`/counter/receipts/${id}`} className="btn-secondary flex items-center" style={{ marginLeft: '10px' }}>
                            View Full Receipt
                        </Link>
                    )}
                </div>
                <button onClick={handlePrint} className="btn-primary flex items-center">
                    <Printer size={16} className="mr-2" /> Reprint
                </button>
            </div>

            {/* Print Area - Matches TempleCounter Design */}
            <div id="print-area">
                <div className="bill-container">
                    <h2 className="bill-title">Temple Receipt</h2>

                    <div className="bill-header">
                        <div>No: {receipt.receiptNumber}</div>
                        <div>Date: {new Date(receipt.date).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="bill-header" style={{ marginBottom: '10px' }}>
                        <div>Vazhipadu: {receipt.vazhipaduType || receipt.vazhipadu}</div>
                        {/* Show all Recurrence Dates if available */}
                        <div>Vazhipad Dates: {
                            isRecurring
                                ? receipt.recurrenceDates.map(d => new Date(d).toLocaleDateString('en-GB')).join(', ')
                                : new Date(receipt.vazhipaduDate || receipt.date).toLocaleDateString('en-GB')
                        }</div>
                        <div>Mode: {receipt.mode}</div>
                    </div>

                    <table className="bill-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Item (Person)</th>
                                <th>Nakshatram</th>
                                <th>Qty</th>
                                <th>Price {isRecurring ? '(Total)' : ''}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.nakshatram}</td>
                                    <td>{item.count}</td>
                                    <td>{item.amount * grandTotalMultiplier}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="total">
                        <strong>Total: ₹ {displayTotal}</strong>
                    </div>

                    <div className="thank-you">
                        <p>Om Namah Shivaya</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .sidebar, .header { display: none !important; }
                }
                @media screen {
                    #print-area { display: block !important; }
                }
            `}</style>
        </div>
    );
};

export default ReceiptView;
