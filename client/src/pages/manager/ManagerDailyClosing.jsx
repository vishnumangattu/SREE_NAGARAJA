import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Printer, Calculator, Calendar } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const ManagerDailyClosing = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Data States
    const [vazhipadCounts, setVazhipadCounts] = useState([]);
    const [incomeData, setIncomeData] = useState([]);

    // Denomination State
    const [denominations, setDenominations] = useState({
        2000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0
    });

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Closing_Report_${selectedDate}`,
    });

    // Define the specific rows requested
    const INITIAL_ROWS = [
        { id: 'stall1', label: 'Stall Varumanam', isSystem: true, systemType: 'stall1' },
        { id: 'counter', label: 'Counter Varumanam', isSystem: true, systemType: 'counter' },
        { id: 'stall2', label: 'Stall 2 Varumanam', isSystem: true, systemType: 'stall2' },
        { id: 'thulabhara', label: 'Thulabhara Counter', isSystem: false },
        { id: 'posting', label: 'Posting Counter', isSystem: false },
        { id: 'payasa1', label: 'Payasa Counter', isSystem: false },
        { id: 'payasa2', label: 'Payasa Counter 2', isSystem: false },
        { id: 'pulluvan', label: 'Pulluvan', isSystem: false },
        { id: 'dakshina', label: 'Dakshina Varavu', isSystem: false },
        { id: 'nilavara', label: 'Nilavara Stall', isSystem: false },
        { id: 'archana', label: 'Archana Dakshina Daily', isSystem: false },
    ];

    useEffect(() => {
        fetchData();
    }, [selectedDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const dateQuery = `?startDate=${selectedDate}&endDate=${selectedDate}`;
            const [receiptsRes, stallsRes] = await Promise.all([
                api.get(`/receipts${dateQuery}`),
                api.get('/stalls/sales')
            ]);

            // 1. Process System Records (Receipts -> Counter)
            const receipts = receiptsRes.data;
            const counterTotal = receipts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
            const counterCash = receipts.filter(r => r.paymentType === 'Cash').reduce((sum, r) => sum + r.totalAmount, 0);
            const counterGPay = receipts.filter(r => r.paymentType !== 'Cash').reduce((sum, r) => sum + r.totalAmount, 0);

            // 2. Process Stall Records
            // Filter stall sales by date
            const stallSales = stallsRes.data.filter(s => new Date(s.date).toDateString() === new Date(selectedDate).toDateString());

            let stall1Total = 0, stall1Cash = 0, stall1GPay = 0;

            stallSales.forEach(s => {
                stall1Total += s.totalAmount;
                if (s.paymentMethod === 'Cash') stall1Cash += s.totalAmount;
                else stall1GPay += s.totalAmount;
            });

            // 3. Process Vazhipad Counts for "List of all vazhipad"
            const vStats = {};
            receipts.forEach(r => {
                if (r.items && Array.isArray(r.items)) {
                    r.items.forEach(item => {
                        const name = item.vazhipadu || r.vazhipadu;
                        const vName = r.vazhipaduType || name;

                        if (!vStats[vName]) {
                            vStats[vName] = { count: 0, totalAmount: 0 };
                        }
                        vStats[vName].count += (item.quantity || 1);
                        vStats[vName].totalAmount += (item.amount || 0);
                    });
                } else {
                    const name = r.vazhipaduType || r.vazhipadu;
                    if (!vStats[name]) {
                        vStats[name] = { count: 0, totalAmount: 0 };
                    }
                    vStats[name].count += 1;
                    vStats[name].totalAmount += (r.totalAmount || 0);
                }
            });

            const vCountList = Object.entries(vStats)
                .map(([name, data]) => ({
                    name,
                    count: data.count,
                    total: data.totalAmount,
                    rate: data.count > 0 ? (data.totalAmount / data.count) : 0
                }))
                .sort((a, b) => b.total - a.total);

            setVazhipadCounts(vCountList);

            // 4. Initialize Table Data
            const rows = INITIAL_ROWS.map(template => {
                let systemAmount = 0;
                let cash = 0;
                let gpay = 0;

                if (template.id === 'counter') {
                    systemAmount = counterTotal;
                    cash = counterCash;
                    gpay = counterGPay;
                } else if (template.id === 'stall1') {
                    systemAmount = stall1Total;
                    cash = stall1Cash;
                    gpay = stall1GPay;
                }

                return {
                    ...template,
                    systemAmount,
                    enteredCash: template.isSystem ? cash : 0,
                    enteredGPay: template.isSystem ? gpay : 0
                };
            });
            setIncomeData(rows);

        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        setIncomeData(prev => prev.map(row => {
            if (row.id === id) {
                return { ...row, [field]: Number(value) };
            }
            return row;
        }));
    };

    const handleDenominationChange = (denom, value) => {
        setDenominations({ ...denominations, [denom]: Number(value) });
    };

    // Calculations
    const totalCashInHand = Object.entries(denominations).reduce((sum, [denom, count]) => {
        if (denom === 'coins') return sum + count;
        return sum + (Number(denom) * count);
    }, 0);

    const totalIncome = incomeData.reduce((acc, row) => ({
        cash: acc.cash + (row.enteredCash || 0),
        gpay: acc.gpay + (row.enteredGPay || 0),
        total: acc.total + (row.enteredCash || 0) + (row.enteredGPay || 0),
        system: acc.system + (row.systemAmount || 0)
    }), { cash: 0, gpay: 0, total: 0, system: 0 });

    const cashShortage = totalCashInHand - totalIncome.cash;

    // --- styles ---
    const pageContainerStyle = {
        maxWidth: '1280px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    };

    const headerContainerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    };

    const titleStyle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
    };

    const dateInputContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    };

    const inputFieldStyle = {
        padding: '0.5rem',
        border: '1px solid #d1d5db',
        borderRadius: '0.375rem',
        outline: 'none',
    };

    const printButtonStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: '500',
        border: 'none',
        cursor: 'pointer',
    };

    const gridContainerStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
        gap: '1.5rem',
    };
    // Responsive grid handling needs media queries which inline styles don't support easily.
    // However, we can default to the desktop view or just use flexbox wrapping if critical.
    // Given the context is likely a desktop dashboard, I will set it to grid-cols-3 as per original LG breakpoint.
    const gridContainerDesktopStyle = {
        ...gridContainerStyle,
        gridTemplateColumns: '2fr 1fr', // Roughly lg:grid-cols-3 (2 cols for table, 1 for denom)
    };

    const cardStyle = {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
    };

    const cardTitleStyle = {
        fontSize: '1.125rem',
        fontWeight: '700',
        marginBottom: '1rem',
    };

    const tableStyle = {
        width: '100%',
        fontSize: '0.875rem',
        borderCollapse: 'collapse',
    };

    const thStyle = {
        padding: '0.75rem',
        textAlign: 'left',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
    };

    const thRightStyle = { ...thStyle, textAlign: 'right' };

    const tdStyle = {
        padding: '0.75rem',
        borderBottom: '1px solid #e5e7eb',
    };

    const tdRightStyle = { ...tdStyle, textAlign: 'right' };

    const inputNumberStyle = {
        width: '6rem',
        textAlign: 'right',
        padding: '0.25rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.25rem',
        backgroundColor: 'white',
        outline: 'none',
    };

    const denomCardStyle = {
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    };

    const denomRowStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        gap: '0.5rem',
    };

    const denomInputStyle = {
        width: '5rem',
        backgroundColor: '#374151',
        border: 'none',
        borderRadius: '0.25rem',
        padding: '0.25rem',
        textAlign: 'center',
        color: 'white',
        fontWeight: '700',
        outline: 'none',
    };

    // Print helper
    // Note: Inline styles for printing need to be carefully handled inside the print container.

    return (
        <div style={pageContainerStyle}>
            {/* Header */}
            <div className="no-print" style={headerContainerStyle}>
                <div>
                    <h1 style={titleStyle}>Daily Closing Report</h1>
                    <div style={dateInputContainerStyle}>
                        <Calendar size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={inputFieldStyle}
                        />
                    </div>
                </div>
                <button onClick={handlePrint} style={printButtonStyle}>
                    <Printer size={18} /> Print Report
                </button>
            </div>

            <div style={gridContainerDesktopStyle}>
                {/* Left Column: Financial Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>Financial Overview</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Source</th>
                                        <th style={{ ...thRightStyle, backgroundColor: '#eff6ff' }}>System Record</th>
                                        <th style={{ ...thRightStyle, backgroundColor: '#f0fdf4' }}>Manual Cash</th>
                                        <th style={{ ...thRightStyle, backgroundColor: '#faf5ff' }}>Manual GPay</th>
                                        <th style={thRightStyle}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeData.map(row => (
                                        <tr key={row.id}>
                                            <td style={{ ...tdStyle, fontWeight: '500' }}>{row.label}</td>
                                            <td style={{ ...tdRightStyle, color: '#1e40af', fontFamily: 'monospace', backgroundColor: 'rgba(239, 246, 255, 0.5)' }}>
                                                {row.isSystem ? `₹ ${row.systemAmount}` : '-'}
                                            </td>
                                            <td style={{ ...tdRightStyle, backgroundColor: 'rgba(240, 253, 244, 0.5)' }}>
                                                <input
                                                    type="number"
                                                    style={{ ...inputNumberStyle, border: '1px solid #d1d5db' }}
                                                    value={row.enteredCash || ''}
                                                    onChange={(e) => handleInputChange(row.id, 'enteredCash', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td style={{ ...tdRightStyle, backgroundColor: 'rgba(250, 245, 255, 0.5)' }}>
                                                <input
                                                    type="number"
                                                    style={{ ...inputNumberStyle, border: '1px solid #d1d5db' }}
                                                    value={row.enteredGPay || ''}
                                                    onChange={(e) => handleInputChange(row.id, 'enteredGPay', e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td style={{ ...tdRightStyle, fontWeight: '700' }}>
                                                ₹ {(row.enteredCash || 0) + (row.enteredGPay || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: '700', borderTop: '2px solid #d1d5db' }}>
                                        <td style={tdStyle}>TOTAL</td>
                                        <td style={{ ...tdRightStyle, color: '#1e40af' }}>₹ {totalIncome.system}</td>
                                        <td style={{ ...tdRightStyle, color: '#166534' }}>₹ {totalIncome.cash}</td>
                                        <td style={{ ...tdRightStyle, color: '#6b21a8' }}>₹ {totalIncome.gpay}</td>
                                        <td style={{ ...tdRightStyle, fontSize: '1.25rem' }}>₹ {totalIncome.total}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Denominations */}
                <div>
                    <div style={denomCardStyle}>
                        <h3 style={{ ...cardTitleStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calculator size={20} /> Denominations
                        </h3>
                        <div>
                            {[2000, 500, 200, 100, 50, 20, 10].map(denom => (
                                <div key={denom} style={denomRowStyle}>
                                    <span style={{ width: '4rem', fontFamily: 'monospace', color: '#9ca3af' }}>₹ {denom}</span>
                                    <span style={{ color: '#6b7280' }}>x</span>
                                    <input
                                        type="number"
                                        style={denomInputStyle}
                                        value={denominations[denom] || ''}
                                        onChange={(e) => handleDenominationChange(denom, e.target.value)}
                                    />
                                    <span style={{ width: '6rem', textAlign: 'right', fontFamily: 'monospace', color: '#4ade80' }}>
                                        = {((denominations[denom] || 0) * denom)}
                                    </span>
                                </div>
                            ))}
                            <div style={{ ...denomRowStyle, paddingTop: '0.5rem', borderTop: '1px solid #374151' }}>
                                <span style={{ width: '4rem', fontFamily: 'monospace', color: '#9ca3af' }}>Coins</span>
                                <span style={{ color: '#6b7280' }}> </span>
                                <input
                                    type="number"
                                    style={denomInputStyle}
                                    value={denominations.coins || ''}
                                    onChange={(e) => handleDenominationChange('coins', e.target.value)}
                                />
                                <span style={{ width: '6rem', textAlign: 'right', fontFamily: 'monospace', color: '#4ade80' }}>
                                    = {denominations.coins || 0}
                                </span>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #4b5563' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#9ca3af' }}>Total Cash in Hand</span>
                                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4ade80' }}>₹ {totalCashInHand}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                <span style={{ color: '#9ca3af' }}>System Cash Total</span>
                                <span style={{ color: 'white' }}>₹ {totalIncome.cash}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: cashShortage < 0 ? 'rgba(127, 29, 29, 0.5)' : 'rgba(20, 83, 45, 0.5)',
                                color: cashShortage < 0 ? '#fecaca' : '#bbf7d0'
                            }}>
                                <span>{cashShortage < 0 ? 'Shortage' : 'Excess/Balanced'}</span>
                                <span style={{ fontWeight: '700' }}>₹ {Math.abs(cashShortage)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Print Layout - Using inline styles strictly */}
            <div style={{ position: 'absolute', top: 0, left: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}>
                <div ref={componentRef} style={{ padding: '2rem', color: 'black', background: 'white', fontFamily: 'serif' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Sree Nagaraja Temple</h1>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Daily Closing Report</h2>
                        <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>Date: {new Date(selectedDate).toLocaleDateString('en-GB')}</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontWeight: '700', borderBottom: '1px solid #000', marginBottom: '0.5rem', paddingBottom: '0.25rem', textTransform: 'uppercase', fontSize: '0.875rem' }}>Income Statement</h3>
                        <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Item</th>
                                    <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>System</th>
                                    <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Cash Entry</th>
                                    <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>GPay Entry</th>
                                    <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomeData.map(row => (
                                    <tr key={row.id}>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', fontWeight: '500' }}>{row.label}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{row.isSystem ? row.systemAmount : '-'}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{row.enteredCash}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{row.enteredGPay}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right', fontWeight: '700' }}>{(row.enteredCash || 0) + (row.enteredGPay || 0)}</td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#f3f4f6', fontWeight: '700' }}>
                                    <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>TOTAL</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{totalIncome.system}</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{totalIncome.cash}</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>{totalIncome.gpay}</td>
                                    <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right', fontSize: '1.125rem' }}>{totalIncome.total}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: '700', borderBottom: '1px solid #000', marginBottom: '0.5rem', paddingBottom: '0.25rem', textTransform: 'uppercase', fontSize: '0.875rem' }}>Cash Denominations</h3>
                            <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                <tbody>
                                    {[2000, 500, 200, 100, 50, 20, 10].map(d => (
                                        <tr key={d}>
                                            <td style={{ padding: '0.25rem 0' }}>₹ {d}</td>
                                            <td style={{ padding: '0.25rem 0', textAlign: 'center' }}>x {denominations[d] || 0}</td>
                                            <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>= {((denominations[d] || 0) * d)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td style={{ padding: '0.25rem 0' }}>Coins</td>
                                        <td style={{ padding: '0.25rem 0', textAlign: 'center', color: '#9ca3af' }}>-</td>
                                        <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>= {denominations.coins || 0}</td>
                                    </tr>
                                    <tr style={{ fontWeight: '700', borderTop: '1px solid black' }}>
                                        <td style={{ paddingTop: '0.5rem' }}>Total Cash</td>
                                        <td></td>
                                        <td style={{ paddingTop: '0.5rem', textAlign: 'right' }}>₹ {totalCashInHand}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: '700', borderBottom: '1px solid #000', marginBottom: '0.5rem', paddingBottom: '0.25rem', textTransform: 'uppercase', fontSize: '0.875rem' }}>Summary</h3>
                            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Total Collection:</span>
                                    <span style={{ fontWeight: '700' }}>₹ {totalIncome.total}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                                    <span> - Cash:</span>
                                    <span>₹ {totalIncome.cash}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                                    <span> - GPay/Online:</span>
                                    <span>₹ {totalIncome.gpay}</span>
                                </div>
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                                    <span>Cash in Hand:</span>
                                    <span>₹ {totalCashInHand}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                    <span>Difference:</span>
                                    <span>{cashShortage}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontWeight: '700', borderBottom: '1px solid #000', marginBottom: '1rem', paddingBottom: '0.25rem', textTransform: 'uppercase', fontSize: '0.875rem' }}>Vazhipad Detailed Count</h3>
                        <div style={{ fontSize: '0.75rem' }}>
                            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse', border: '1px solid #d1d5db' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'left' }}>Name</th>
                                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'center' }}>Count</th>
                                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Rate</th>
                                        <th style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vazhipadCounts.map(v => (
                                        <tr key={v.name}>
                                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}>{v.name}</td>
                                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'center' }}>{v.count}</td>
                                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>₹ {Math.round(v.rate)}</td>
                                            <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right', fontWeight: '700' }}>₹ {v.total}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: '#f3f4f6', fontWeight: '700' }}>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>Total</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'center' }}>{vazhipadCounts.reduce((acc, curr) => acc + curr.count, 0)}</td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}></td>
                                        <td style={{ border: '1px solid #d1d5db', padding: '0.5rem', textAlign: 'right' }}>₹ {vazhipadCounts.reduce((acc, curr) => acc + curr.total, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingTop: '2rem', borderTop: '1px solid #d1d5db' }}>
                        <div style={{ textAlign: 'center', width: '8rem' }}>
                            <p style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>Treasurer</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '8rem' }}>
                            <p style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>Secretary</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '8rem' }}>
                            <p style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>President</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDailyClosing;
