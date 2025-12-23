import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Edit2, Eye, Calendar, DollarSign, FileText } from 'lucide-react';

const StallHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/stalls/sales');
            setSales(data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <HistoryIcon /> History
                </h1>
                <Link to="/stall" className="btn-primary">
                    New Sheet
                </Link>
            </div>

            <div className="card p-0 overflow-hidden shadow-sm border border-gray-100">
                <div className="table-container">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4 border-b">Date</th>
                                <th className="p-4 border-b">Total Items</th>
                                <th className="p-4 border-b text-right">Total Amount</th>
                                <th className="p-4 border-b text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sales.map((sale) => (
                                <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800">
                                                {new Date(sale.date).toLocaleDateString('en-GB')}
                                            </span>
                                            <span className="text-xs text-muted">
                                                {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {sale.items.length} Entries
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted mt-1 truncate max-w-xs">
                                            {sale.items.slice(0, 3).map(i => i.name || 'Entry').join(', ')}
                                            {sale.items.length > 3 && '...'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="font-mono font-bold text-blue-600 text-lg">
                                            ₹ {sale.totalAmount.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <Link
                                            to={`/stall/edit/${sale._id}`}
                                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="View / Edit"
                                        >
                                            <Edit2 size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                                        No history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 6v6l4 2" />
    </svg>
);

export default StallHistory;
