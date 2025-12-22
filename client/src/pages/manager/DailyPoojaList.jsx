import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { Printer, Search, Calendar, CheckSquare, Square } from "lucide-react";
import { useReactToPrint } from "react-to-print";

function DailyPoojaList() {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [vazhipads, setVazhipads] = useState([]);
    const [selectedVazhipads, setSelectedVazhipads] = useState(new Set());
    const [groupedData, setGroupedData] = useState({});
    const [loading, setLoading] = useState(false);
    const [generatedInfo, setGeneratedInfo] = useState(null); // Store date/info for print header
    const printRef = useRef(null);

    useEffect(() => {
        fetchVazhipads();
    }, []);

    // Auto-generate when date or selection changes, but only after initial load
    useEffect(() => {
        if (selectedVazhipads.size > 0) {
            generateData(date, selectedVazhipads);
        }
    }, [date]); // Removed selectedVazhipads from dependency to avoid loop if not needed, or add it if auto-refresh on selection is desired too. User asked for date change.


    const fetchVazhipads = async () => {
        try {
            const { data } = await api.get('/vazhipads');
            setVazhipads(data);
            const allIds = new Set(data.map(v => v.name));
            setSelectedVazhipads(allIds);

            // Auto-load preview for today
            generateData(date, allIds);
        } catch (error) {
            console.error("Failed to fetch vazhipads", error);
        }
    };

    const toggleVazhipad = (name) => {
        const newSet = new Set(selectedVazhipads);
        if (newSet.has(name)) {
            newSet.delete(name);
        } else {
            newSet.add(name);
        }
        setSelectedVazhipads(newSet);
    };

    const toggleAll = () => {
        if (selectedVazhipads.size === vazhipads.length) {
            setSelectedVazhipads(new Set());
        } else {
            setSelectedVazhipads(new Set(vazhipads.map(v => v.name)));
        }
    };

    const generateData = async (targetDate, targetSet) => {
        if (targetSet.size === 0) {
            alert("Please select at least one Vazhipad.");
            return;
        }

        setLoading(true);
        try {
            // Fetch receipts strictly for the Vazhipadu Date (Booking Date)
            const { data } = await api.get(`/receipts?vazhipaduDate=${targetDate}&limit=2000`);

            // Client-side Filter & Group
            const groups = {};
            let count = 0;
            const processedItems = new Set(); // To track duplicates: vName-receiptNo-name-star

            // Iterate through receipts and their items
            data.forEach(receipt => {
                const vName = receipt.vazhipaduType || receipt.vazhipadu;

                if (targetSet.has(vName)) {
                    if (!groups[vName]) {
                        groups[vName] = [];
                    }

                    receipt.items.forEach(item => {
                        // Create unique key for deduplication
                        // Key format: VazhipadName|ReceiptNo|PersonName|Star
                        // We use a safe delimiter like '||'
                        const uniqueKey = `${vName}||${receipt.receiptNumber}||${item.name}||${item.nakshatram}`;

                        if (!processedItems.has(uniqueKey)) {
                            processedItems.add(uniqueKey);

                            groups[vName].push({
                                receiptNumber: receipt.receiptNumber,
                                name: item.name,
                                nakshatram: item.nakshatram,
                                count: 1 // User requested to always show qty as 1 for these merged entries
                            });
                            count++;
                        }
                    });
                }
            });

            setGroupedData(groups);
            setGeneratedInfo({
                date: new Date(targetDate),
                totalItems: count
            });

        } catch (error) {
            console.error(error);
            alert("Failed to generate list");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        generateData(date, selectedVazhipads);
    };

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Daily_Pooja_List_${date}`,
        bodyClass: "print-body"
    });

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '100vh',
            fontFamily: '"Inter", sans-serif',
            background: 'linear-gradient(to bottom right, #f8f9fa, #e9ecef)' // Subtle background
        }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                padding: '1.5rem 2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.5)'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: '#1a202c',
                        margin: 0,
                        letterSpacing: '-0.5px'
                    }}>Daily Pooja List</h1>
                    <p style={{ color: '#718096', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                        Generate and print daily schedules
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#fff',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                        <Calendar size={18} style={{ color: '#4a5568' }} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                fontSize: '0.95rem',
                                color: '#2d3748',
                                fontWeight: '500',
                                fontFamily: 'inherit',
                                background: 'transparent'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                {/* Left Sidebar: Vazhipad Selection */}
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)',
                    border: '1px solid #edf2f7',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 180px)', // Fixed height based on viewport
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '1.25rem',
                        borderBottom: '1px solid #edf2f7',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc'
                    }}>
                        <h3 style={{ margin: 0, fontWeight: '600', color: '#2d3748' }}>Vazhipads</h3>
                        <button
                            onClick={toggleAll}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#3182ce',
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.color = '#2c5282'}
                            onMouseOut={(e) => e.target.style.color = '#3182ce'}
                        >
                            {selectedVazhipads.size === vazhipads.length ? 'Unselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="custom-scrollbar" style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0.75rem'
                    }}>
                        {vazhipads.map(v => {
                            const isSelected = selectedVazhipads.has(v.name);
                            return (
                                <label key={v._id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: isSelected ? '#ebf8ff' : 'transparent',
                                    marginBottom: '4px'
                                }}>
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: isSelected ? 'none' : '2px solid #cbd5e0',
                                        background: isSelected ? '#3182ce' : '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}>
                                        {isSelected && <CheckSquare size={14} color="#fff" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        style={{ display: 'none' }}
                                        checked={isSelected}
                                        onChange={() => toggleVazhipad(v.name)}
                                    />
                                    <span style={{
                                        fontSize: '0.9rem',
                                        fontWeight: isSelected ? '600' : '400',
                                        color: isSelected ? '#2c5282' : '#4a5568'
                                    }}>{v.name}</span>
                                </label>
                            )
                        })}
                    </div>

                    <div style={{ padding: '1.25rem', borderTop: '1px solid #edf2f7', background: '#fff' }}>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: loading ? 'wait' : 'pointer',
                                boxShadow: '0 4px 6px rgba(66, 153, 225, 0.3)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                            onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            {loading ? 'Generating...' : <><Search size={18} /> Generate View</>}
                        </button>
                    </div>
                </div>

                {/* Right Content: Preview */}
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03)',
                    border: '1px solid #edf2f7',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 180px)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '1.25rem 2rem',
                        borderBottom: '1px solid #edf2f7',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8fafc'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#2d3748' }}>Preview List</h2>
                        {generatedInfo && (
                            <button
                                onClick={handlePrint}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    background: '#48bb78',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(72, 187, 120, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Printer size={18} /> Print List
                            </button>
                        )}
                    </div>

                    <div className="custom-scrollbar" style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '2rem',
                        background: '#f7fafc'
                    }}>
                        {!generatedInfo ? (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#a0aec0'
                            }}>
                                <div style={{
                                    padding: '2rem',
                                    background: '#edf2f7',
                                    borderRadius: '50%',
                                    marginBottom: '1rem'
                                }}>
                                    <Search size={48} color="#cbd5e0" />
                                </div>
                                <p style={{ fontWeight: '500' }}>Customize criteria and click Generate</p>
                            </div>
                        ) : Object.keys(groupedData).length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p style={{ color: '#718096', fontWeight: '500' }}>No bookings found for selected criteria.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                                {Object.entries(groupedData).map(([vName, items]) => (
                                    <div key={vName} style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <h3 style={{
                                            margin: '0 0 1rem 0',
                                            fontSize: '1.1rem',
                                            color: '#2b6cb0',
                                            borderBottom: '2px solid #ebf8ff',
                                            paddingBottom: '0.5rem',
                                            fontWeight: '700'
                                        }}>{vName}</h3>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: '600' }}>Name</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#718096', fontWeight: '600', width: '140px' }}>Star</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'right', color: '#718096', fontWeight: '600', width: '80px' }}>Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                        <td style={{ padding: '0.75rem', color: '#2d3748', fontWeight: '500' }}>{item.name}</td>
                                                        <td style={{ padding: '0.75rem', color: '#4a5568' }}>{item.nakshatram || '-'}</td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2d3748', fontWeight: '600' }}>{item.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Print Component */}
            <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
                <div ref={printRef} className="p-8 bg-white text-black font-serif">
                    <div className="text-center mb-8 border-b-2 border-black pb-4">
                        <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Temple Daily Pooja List</h1>
                        {generatedInfo && (
                            <p className="font-bold text-xl">
                                Date: {generatedInfo.date.toLocaleDateString("en-GB", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>

                    {Object.entries(groupedData).map(([vName, items]) => (
                        <div key={vName} className="mb-8 keep-together" style={{ pageBreakInside: 'avoid' }}>
                            <div className="mb-2 border-b border-gray-400 pb-1">
                                <h2 className="text-xl font-bold uppercase">{vName}</h2>
                            </div>
                            <table className="w-full text-sm border-collapse border border-black mb-4">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-1 text-left">Name</th>
                                        <th className="border border-black p-1 w-32 text-left">Star</th>
                                        <th className="border border-black p-1 w-12 text-center">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-1 font-bold px-2">{item.name}</td>
                                            <td className="border border-black p-1 px-2">{item.nakshatram}</td>
                                            <td className="border border-black p-1 text-center">{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}

                    <div className="mt-8 pt-4 border-t border-black text-right text-xs">
                        Generated on: {new Date().toLocaleString()}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e0;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #a0aec0;
                }
            `}</style>
        </div>
    );
}

export default DailyPoojaList;
