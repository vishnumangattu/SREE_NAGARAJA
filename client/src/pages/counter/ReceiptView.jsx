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

        // Calculate display total
        displayTotal = displayItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0) * grandTotalMultiplier;
    }

    // Chunk items into pages of 5
    const itemsPerPage = 5;
    const pages = [];
    for (let i = 0; i < displayItems.length; i += itemsPerPage) {
        pages.push(displayItems.slice(i, i + itemsPerPage));
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

            {/* Screen View - Visible ONLY on screen */}
            <div className="screen-view">
                <div className="bill-container">
                    <h2 className="bill-title">Temple Receipt</h2>

                    <div className="bill-header">
                        <div>No: {receipt.receiptNumber}</div>
                        <div>Date: {new Date(receipt.date).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="bill-header" style={{ marginBottom: '10px' }}>
                        <div>Vazhipadu: {receipt.vazhipaduType || receipt.vazhipadu}</div>
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
                                <th>Sl No</th>
                                <th>Name</th>
                                <th>Nakshatram</th>
                                <th>Rate</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.name}</td>
                                    <td>{item.nakshatram}</td>
                                    <td>{Number(item.amount).toFixed(2)}</td>
                                    <td>{(item.amount * grandTotalMultiplier).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="total">
                        <strong>Total: ₹ {displayTotal.toFixed(2)}</strong>
                    </div>

                    <div className="thank-you">
                        <p>Om Namah Shivaya</p>
                    </div>
                </div>
            </div>

            {/* Print Area - Visible ONLY during print */}
            <div id="print-area">
                {pages.map((pageItems, pageIndex) => (
                    <div key={pageIndex} className="print-page" style={{ pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto', position: 'relative', height: '100vh', padding: '20px' }}>

                        {/* Header: Receipt No & Date (Top Right) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '40px', paddingTop: '50px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{receipt.receiptNumber}</div>
                            <div style={{ fontSize: '14px', marginTop: '5px' }}>{new Date(receipt.date).toLocaleDateString('en-GB')}</div>
                        </div>

                        {/* Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <tbody>
                                {pageItems.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '8px', width: '30px' }}>{(pageIndex * itemsPerPage) + idx + 1}</td>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.name}</td>
                                        <td style={{ padding: '8px' }}>{item.nakshatram}</td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>{Number(item.amount).toFixed(2)}</td>
                                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(item.amount * grandTotalMultiplier).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer (Total) - Only on last page */}
                        {pageIndex === pages.length - 1 && (
                            <div style={{ position: 'absolute', bottom: '150px', right: '50px', textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{displayTotal.toFixed(2)}</div>
                            </div>
                        )}

                        {/* Footer (Date) - Bottom Center/Left */}
                        <div style={{ position: 'absolute', bottom: '50px', left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}>
                            {new Date(receipt.date).toLocaleDateString('en-GB')}
                        </div>

                    </div>
                ))}
            </div>

            <style>{`
                /* Screen Styles */
                @media screen {
                    #print-area { display: none; } /* Hide print layout on screen */
                    .screen-view { display: block; } /* Show screen layout */
                }

                /* Print Styles */
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        display: block;
                    }
                    .no-print, .screen-view { display: none !important; } /* Hide controls and screen layout */
                    .sidebar, .header { display: none !important; }
                    @page { size: auto; margin: 0mm; }
                    
                    tr { height: 40px; }
                }
            `}</style>
        </div>
    );
};

export default ReceiptView;
