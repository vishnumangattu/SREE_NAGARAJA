import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar, Filter, Download, ChevronDown, ChevronUp, AlertCircle, Search } from 'lucide-react';

const ClosingReportsView = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [counters, setCounters] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        counterId: ''
    });

    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        fetchCounters();
        fetchReports();
    }, []);

    const fetchCounters = async () => {
        try {
            const { data } = await api.get('/users');
            // Filter only counters if the API returns mixed roles
            const counterUsers = data.filter(u => u.role === 'counter');
            setCounters(counterUsers);
        } catch (error) {
            console.error("Error fetching counters", error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.counterId) params.counterId = filters.counterId;

            const { data } = await api.get('/closing-reports', { params });
            setReports(data);
        } catch (error) {
            console.error("Error fetching reports", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = (e) => {
        e.preventDefault();
        fetchReports();
    };

    const resetFilters = () => {
        setFilters({ startDate: '', endDate: '', counterId: '' });
        // We'll rely on the next fetchReports call which user triggers via Filter, 
        // or we can auto-trigger it. Let's auto-fetch for convenience.
        // But state update is async, so we pass empty object to fetchReports manually or use effect dependency.
        // Let's just reset state and let user click filter, or chain calls.
        // Better:
        setFilters({ startDate: '', endDate: '', counterId: '' });
        setTimeout(() => fetchReportsWithParams({}), 0);
    };

    // Helper to fetch with explicit params bypassing state lag if needed
    const fetchReportsWithParams = async (params) => {
        setLoading(true);
        try {
            const { data } = await api.get('/closing-reports', { params });
            setReports(data);
        } catch (error) {
            console.error("Error fetching reports", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id) => {
        if (expandedRow === id) setExpandedRow(null);
        else setExpandedRow(id);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Closing Reports</h1>
            </div>

            {/* Filter Bar */}
            <div className="card p-4 mb-6 bg-white shadow-sm rounded-lg">
                <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            className="input-field"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            className="input-field"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Counter Staff</label>
                        <select
                            name="counterId"
                            className="input-field min-w-[200px]"
                            value={filters.counterId}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Counters</option>
                            {counters.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn-primary flex items-center gap-2">
                            <Filter size={18} /> Filter
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 bg-white"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Reports Table */}
            <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700">Date & Time</th>
                                <th className="p-4 font-semibold text-gray-700">Counter Staff</th>
                                <th className="p-4 font-semibold text-gray-700 text-right">System Total</th>
                                <th className="p-4 font-semibold text-gray-700 text-right">Cash Entered</th>
                                <th className="p-4 font-semibold text-gray-700 text-right">Discrepancy</th>
                                <th className="p-4 font-semibold text-gray-700 text-center">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">Loading reports...</td>
                                </tr>
                            ) : reports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-500">No reports found matching criteria.</td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <React.Fragment key={report._id}>
                                        <tr
                                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${expandedRow === report._id ? 'bg-blue-50' : ''}`}
                                            onClick={() => toggleRow(report._id)}
                                        >
                                            <td className="p-4 text-gray-600">{formatDate(report.createdAt)}</td>
                                            <td className="p-4 font-medium text-gray-800">{report.counterId?.name || 'Unknown'}</td>
                                            <td className="p-4 text-right font-mono font-medium">₹ {report.receiptTotal}</td>
                                            <td className="p-4 text-right font-mono font-medium">₹ {report.totalCashEntered}</td>
                                            <td className={`p-4 text-right font-bold ${report.discrepancy === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {report.discrepancy > 0 ? '+' : ''}{report.discrepancy}
                                            </td>
                                            <td className="p-4 text-center text-gray-400">
                                                {expandedRow === report._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </td>
                                        </tr>
                                        {expandedRow === report._id && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="6" className="p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-4">
                                                        {/* Denominations Breakdown */}
                                                        <div>
                                                            <h4 className="text-sm font-semibold uppercase text-gray-500 mb-2">Denominations Breakdown</h4>
                                                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm bg-white p-3 rounded border">
                                                                {Object.entries(report.denominations || {})
                                                                    .sort((a, b) => {
                                                                        // Sort denominations descending (coins last)
                                                                        if (a[0] === 'coins') return 1;
                                                                        if (b[0] === 'coins') return -1;
                                                                        return Number(b[0]) - Number(a[0]);
                                                                    })
                                                                    .map(([denom, count]) => {
                                                                        if (!count && count !== 0) return null; // skip undefined
                                                                        if (count === "" || count === 0) return null; // skip empty/zero if preferred, or show valid 0

                                                                        const val = Number(count);
                                                                        const multiplier = denom === 'coins' ? 1 : Number(denom);
                                                                        const subtotal = val * multiplier;

                                                                        return (
                                                                            <React.Fragment key={denom}>
                                                                                <div className="flex justify-between border-b border-gray-100 last:border-0 py-1">
                                                                                    <span className="text-gray-600 font-mono">
                                                                                        {denom === 'coins' ? 'Coins' : `₹ ${denom}`} <span className="text-xs text-gray-400">x {val}</span>
                                                                                    </span>
                                                                                    <span className="font-medium">₹ {subtotal}</span>
                                                                                </div>
                                                                            </React.Fragment>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* Notes / Summary */}
                                                        <div>
                                                            <h4 className="text-sm font-semibold uppercase text-gray-500 mb-2">Report Summary</h4>
                                                            <div className="bg-white p-3 rounded border space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Total Cash counted:</span>
                                                                    <span className="font-bold">₹ {report.totalCashEntered}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">System Cash Recorded:</span>
                                                                    <span className="font-bold">₹ {report.receiptTotal}</span>
                                                                </div>
                                                                <div className={`flex justify-between border-t pt-2 mt-2 ${report.discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                    <span className="font-semibold">Difference:</span>
                                                                    <span className="font-bold">{report.discrepancy > 0 ? '+' : ''}{report.discrepancy}</span>
                                                                </div>

                                                                {report.notes && (
                                                                    <div className="mt-4 pt-2 border-t text-gray-600">
                                                                        <span className="block font-semibold text-xs uppercase text-gray-400 mb-1">Notes:</span>
                                                                        <p className="italic">"{report.notes}"</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClosingReportsView;
