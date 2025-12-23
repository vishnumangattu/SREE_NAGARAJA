import { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import './temple.css';

const ReceiptView = () => {
    const { id } = useParams();
    const location = useLocation();
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);

    const { user } = useContext(AuthContext); // Get user role
    const navigate = useNavigate();

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
        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
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

    // Hooks moved to top level

    const handleBack = () => {
        if (user?.role === 'manager' || user?.role === 'superadmin') {
            navigate('/manager/receipts');
        } else {
            navigate('/counter/history');
        }
    };

    return (
        <div className="container">
            {/* No Print Header */}
            <div className="no-print flex justify-between items-center mb-6">
                <div className="flex gap-4">
                    <button onClick={handleBack} className="btn-secondary flex items-center" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={16} className="mr-2" /> Back
                    </button>
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
                    <div key={pageIndex} className="print-page receipt-layout">

                        {/* Header Box */}
                        <div className="receipt-border">
                            {/* Top Header */}
                            <div className="receipt-header">
                                <div className="temple-logo">
                                    {/* Placeholder for Logo */}
                                    <div className="logo-placeholder"></div>
                                </div>
                                <div className="temple-info">
                                    <h1 className="temple-name">ആദിമൂലം വെട്ടിക്കോട് ശ്രീ നാഗരാജസ്വാമി ക്ഷേത്രം</h1>
                                    <p className="temple-address">വെട്ടിക്കോട് പി.ഒ., പള്ളിക്കൽ, ആലപ്പുഴ 690 503 ഫോൺ : +91 479 233 99 33, 8334 82 82 82</p>
                                </div>
                            </div>

                            {/* Orange Banner */}
                            <div className="receipt-banner">
                                വഴിപാട് രസീത്
                            </div>

                            {/* Receipt Details Row */}
                            <div className="receipt-meta-grid">
                                <div className="meta-left">
                                    <div className="meta-label">വഴിപാടിനം</div>
                                    <div className="meta-value">{receipt.vazhipaduType || receipt.vazhipadu}</div>
                                </div>
                                <div className="meta-right">
                                    <div className="receipt-no-date">
                                        <div className="rn-date">{new Date(receipt.date).toLocaleDateString('en-GB')}</div>
                                        <div className="rn-number">നമ്പർ : <b>{receipt.receiptNumber}</b></div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <table className="receipt-table">
                                <thead>
                                    <tr>
                                        <th className="col-no">നം.</th>
                                        <th className="col-name">പേര്</th>
                                        <th className="col-star">ജന്മനക്ഷത്രം</th>
                                        <th className="col-rate text-right">നിരക്ക്</th>
                                        <th className="col-amount text-right">തുക</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="col-no">{(pageIndex * itemsPerPage) + idx + 1}</td>
                                            <td className="col-name">{item.name}</td>
                                            <td className="col-star">{item.nakshatram}</td>
                                            <td className="col-rate text-right">{Number(item.amount).toFixed(2)}</td>
                                            <td className="col-amount text-right">{(item.amount * grandTotalMultiplier).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Fill empty rows to maintain height if needed, OR just leave as is */}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Totals (Only on last page, connected to the border if possible or just below) */}
                        {pageIndex === pages.length - 1 && (
                            <div className="receipt-footer-row">
                                <div className="footer-left-info">
                                    <div className="generated-line">
                                        {displayTotal.toFixed(2)} രൂപ കൈപ്പറ്റി / {new Date().toLocaleString('en-GB')} / {user?.name || 'Counter'}
                                    </div>
                                    <div className="vazhipad-date-line">
                                        വഴിപാട് തീയതി : {
                                            isRecurring
                                                ? receipt.recurrenceDates.map(d => new Date(d).toLocaleDateString('en-GB')).join(', ')
                                                : new Date(receipt.vazhipaduDate || receipt.date).toLocaleDateString('en-GB')
                                        }
                                    </div>
                                </div>
                                <div className="footer-total-box">
                                    <span className="total-label">ആകെ തുക</span>
                                    <span className="total-amount">{displayTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="page-num">
                            {pageIndex + 1} of {pages.length}
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
                    /* Visibility handled by global index.css via .printing class */
                    
                    #print-area { 
                        display: block;
                        width: 100%;
                    }
                    
                    @page { size: auto; margin: 0mm; }
                }
            `}</style>
        </div>
    );
};

export default ReceiptView;
