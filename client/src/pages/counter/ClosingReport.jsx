import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './temple.css'; // Reusing temple styles for consistency
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const ClosingReport = () => {
    const navigate = useNavigate();
    const [denominations, setDenominations] = useState({
        "2000": "", "500": "", "200": "", "100": "",
        "50": "", "20": "", "10": "", "5": "", "1": "", "coins": ""
    });
    const [systemTotals, setSystemTotals] = useState({
        cashTotal: 0,
        upiTotal: 0,
        onlineTxnTotal: 0,
        moneyOrderTotal: 0,
        grandTotal: 0
    });
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        fetchDailyTotal();
    }, []);

    const fetchDailyTotal = async () => {
        try {
            const { data } = await api.get('/closing-reports/daily-total');
            setSystemTotals({
                cashTotal: data.cashTotal || 0,
                upiTotal: data.upiTotal || 0,
                onlineTxnTotal: data.onlineTxnTotal || 0,
                moneyOrderTotal: data.moneyOrderTotal || 0,
                grandTotal: data.total || 0
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching daily total", error);
            setLoading(false);
        }
    };

    const handleChange = (denom, value) => {
        setDenominations(prev => ({ ...prev, [denom]: value }));
    };

    const calculateTotalCash = () => {
        let total = 0;
        Object.entries(denominations).forEach(([denom, count]) => {
            const multiplier = denom === "coins" ? 1 : Number(denom);
            total += (Number(count) || 0) * multiplier;
        });
        return total;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const totalCash = calculateTotalCash();

        // We compare Cash Entered vs System Cash
        const payload = {
            denominations,
            totalCashEntered: totalCash,
            receiptTotal: systemTotals.cashTotal,
            notes: `Other Collections: UPI: ${systemTotals.upiTotal}, Online: ${systemTotals.onlineTxnTotal}, MoneyOrder: ${systemTotals.moneyOrderTotal}`
        };

        try {
            const { data } = await api.post('/closing-reports', payload);
            setSubmitted(true);
            setReportData(data);
            alert("Closing Report Submitted Successfully!");
        } catch (error) {
            console.error("Error submitting report", error);
            alert("Failed to submit report");
        }
    };

    const totalCash = calculateTotalCash();
    const discrepancy = totalCash - systemTotals.cashTotal;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
            <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading Report...</div>
        </div>
    );

    if (submitted) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ background: 'white', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
                    <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem', color: '#16a34a' }}>
                        <CheckCircle size={48} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>Report Submitted!</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>Your shift closing report has been successfully logged.</p>

                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#64748b' }}>Total Cash Counted</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>₹ {reportData.totalCashEntered}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem' }}>
                            <span style={{ color: '#64748b' }}>System Cash Total</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>₹ {reportData.receiptTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: '500' }}>Difference</span>
                            <span style={{
                                fontWeight: '800',
                                color: reportData.discrepancy === 0 ? '#16a34a' : '#ef4444',
                                padding: '0.25rem 0.75rem',
                                background: reportData.discrepancy === 0 ? '#dcfce7' : '#fee2e2',
                                borderRadius: '99px',
                                fontSize: '0.875rem'
                            }}>
                                {reportData.discrepancy > 0 ? '+' : ''}{reportData.discrepancy}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/counter')}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem' }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.025em' }}>Daily Closing Report</h1>
                        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Verify cash collection and close your shift.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', letterSpacing: '0.05em' }}>Current Date</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                    {/* Left Column: Denominations Form */}
                    <div style={{ gridColumn: 'span 7' }}>
                        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Cash Breakdown</h3>
                                <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>
                                    Enter count per note
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {["2000", "500", "200", "100", "50", "20", "10", "5", "1", "coins"].map((denom) => (
                                        <div key={denom} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'all 0.2s', position: 'relative' }}>
                                            <div style={{ minWidth: '60px', fontWeight: '700', color: '#475569', fontSize: '0.875rem' }}>
                                                {denom === "coins" ? "🪙 Coins" : `₹ ${denom}`}
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={denominations[denom]}
                                                onChange={(e) => handleChange(denom, e.target.value)}
                                                style={{
                                                    flex: 1,
                                                    margin: '0 1rem',
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid #cbd5e1',
                                                    textAlign: 'center',
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    color: '#0f172a',
                                                    width: '100%',
                                                    outline: 'none'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                            />
                                            <div style={{ minWidth: '60px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                                                ₹ {(Number(denominations[denom]) || 0) * (denom === "coins" ? 1 : Number(denom))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500' }}>Total Cash Counted</span>
                                    <span style={{ color: 'white', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em' }}>₹ {totalCash.toLocaleString()}</span>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        fontSize: '1.125rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                                    }}
                                >
                                    <Save size={20} /> Submit Final Report
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Summaries */}
                    <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* System Cash Card */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', borderLeft: '6px solid #3b82f6', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '700', marginBottom: '0.5rem' }}>System Cash Record</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                ₹ {systemTotals.cashTotal.toLocaleString()}
                            </div>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>Total cash collected according to system.</p>
                        </div>

                        {/* Discrepancy Card */}
                        <div style={{
                            background: discrepancy === 0 ? '#f0fdf4' : '#fef2f2',
                            borderRadius: '24px',
                            padding: '2rem',
                            borderLeft: `6px solid ${discrepancy === 0 ? '#22c55e' : '#ef4444'}`,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: discrepancy === 0 ? '#15803d' : '#b91c1c', fontWeight: '700' }}>Cash Discrepancy</h3>
                                {discrepancy !== 0 && <AlertCircle size={20} color="#ef4444" />}
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: discrepancy === 0 ? '#166534' : '#991b1b', letterSpacing: '-0.05em', lineHeight: 1 }}>
                                {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString()}
                            </div>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: discrepancy === 0 ? '#16a34a' : '#ef4444' }}>
                                {discrepancy === 0 ? 'Perfect Match! No discrepancy.' : 'Mismatch between counted cash and system record.'}
                            </p>
                        </div>

                        {/* Other Collections */}
                        <div style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>Other Collections (Info Only)</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: '#eff6ff', borderRadius: '16px', padding: '1rem', border: '1px solid #dbeafe' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '0.25rem' }}>UPI / GPay</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e3a8a' }}>₹ {systemTotals.upiTotal.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#fff7ed', borderRadius: '16px', padding: '1rem', border: '1px solid #ffedd5' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Money Order</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#7c2d12' }}>₹ {systemTotals.moneyOrderTotal.toLocaleString()}</div>
                                </div>
                                <div style={{ background: '#f0fdfa', borderRadius: '16px', padding: '1rem', border: '1px solid #ccfbf1', gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0f766e', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Online Transaction</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#134e4a' }}>₹ {systemTotals.onlineTxnTotal.toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '50%', color: '#0d9488' }}>🌐</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <div style={{ display: 'inline-block', background: '#f1f5f9', padding: '0.5rem 1.5rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>
                                Total Collection: <span style={{ color: '#0f172a' }}>₹ {systemTotals.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClosingReport;
