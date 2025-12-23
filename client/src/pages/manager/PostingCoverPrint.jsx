import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Printer } from "lucide-react";

const PostingCoverPrint = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchReceipts = async () => {
        setLoading(true);
        try {
            // Filter by Date Range and 'np' code (or 'noorumpaalum' just in case, but user said 'np' triggers validation)
            const { data } = await api.get(`/receipts?startDate=${startDate}&endDate=${endDate}&vazhipadu=np`);
            // Filter client-side to be safe if 'np' matches other things, or just take all 'np' results
            // Also ensure they have addresses
            const validReceipts = data.filter(r =>
                (r.vazhipadu.toLowerCase().includes('np') || r.vazhipaduType.toLowerCase().includes('np')) &&
                r.postingDetails &&
                r.postingDetails.address
            );
            setReceipts(validReceipts);
        } catch (error) {
            console.error("Error fetching receipts", error);
            alert("Failed to fetch receipts");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        document.body.classList.add('printing');
        window.print();
        document.body.classList.remove('printing');
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 no-print">Posting Cover Printing</h1>

            {/* Filter Section - Hidden on Print */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4 items-end no-print">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="p-2 border rounded"
                    />
                </div>
                <button
                    onClick={fetchReceipts}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Filter Receipts'}
                </button>
                <button
                    onClick={handlePrint}
                    disabled={receipts.length === 0}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 ml-auto"
                >
                    <Printer size={18} /> Print Covers
                </button>
            </div>

            {/* List for Preview */}
            <div className="bg-white rounded-lg shadow overflow-hidden no-print">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {receipts.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No receipts found for the selected range and 'NB' criteria.
                                </td>
                            </tr>
                        ) : (
                            receipts.map((r) => (
                                <tr key={r._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(r.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        #{r.receiptNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {r.items[0]?.name || r.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                        {r.postingDetails?.address}
                                        {r.postingDetails?.pincode && `, ${r.postingDetails.pincode}`}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Print Area - Visible ONLY on Print */}
            <div id="print-area">
                <div className="grid grid-cols-2 gap-8">
                    {receipts.map((r, idx) => (
                        <div key={idx} className="address-label p-6 border border-gray-300 rounded mb-4 break-inside-avoid">
                            <div className="font-bold text-sm mb-2">To,</div>
                            <div className="text-lg font-bold mb-1">{r.items[0]?.name || 'Devotee'}</div>
                            <div className="whitespace-pre-wrap text-base mb-2">{r.postingDetails?.address}</div>

                            <div className="flex justify-between items-end mt-4">
                                {r.postingDetails?.pincode && (
                                    <div className="font-bold">PIN: {r.postingDetails.pincode}</div>
                                )}
                                {r.postingDetails?.phone && (
                                    <div className="text-sm">Ph: {r.postingDetails.phone}</div>
                                )}
                            </div>

                            <div className="text-xs text-gray-400 mt-4 text-right">
                                Rcpt: #{r.receiptNumber} | {new Date(r.date).toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @media screen {
                    #print-area { display: none; }
                }
                @media print {
                    @page { margin: 10mm; }
                    /* Global reset handles visibility via .printing class */
                    
                    /* Just ensure local grid layout works */
                    #print-area .grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }

                    .address-label {
                        border: 1px solid #000;
                        padding: 20px;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
};

export default PostingCoverPrint;
