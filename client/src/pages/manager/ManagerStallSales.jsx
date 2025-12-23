import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Filter, Calendar, Search } from 'lucide-react';

const ManagerStallSales = () => {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0], // Default to Today
        staffName: '',
        paymentMethod: ''
    });

    useEffect(() => {
        fetchSales();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, sales]);

    const fetchSales = async () => {
        try {
            const { data } = await api.get('/stalls/sales');
            setSales(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stall sales", error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = sales;

        if (filters.date) {
            result = result.filter(s => new Date(s.date).toDateString() === new Date(filters.date).toDateString());
        }

        if (filters.staffName) {
            result = result.filter(s =>
                s.soldBy && s.soldBy.name.toLowerCase().includes(filters.staffName.toLowerCase())
            );
        }

        if (filters.paymentMethod) {
            result = result.filter(s => s.paymentMethod === filters.paymentMethod);
        }

        // Sort by Time Descending (Newest First)
        result.sort((a, b) => new Date(b.date) - new Date(a.date));

        setFilteredSales(result);
    };

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

    if (loading) return <div>Loading Stall Sales...</div>;

    const totalAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Stall Sales Management</h1>
                    <p className="text-muted">View all entries from Stall Users</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} /> Filters
                </h3>
                <div className="grid grid-auto-fit" style={{ alignItems: 'end' }}>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                name="date"
                                value={filters.date}
                                onChange={handleFilterChange}
                                className="input-field w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Staff Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="staffName"
                                value={filters.staffName}
                                onChange={handleFilterChange}
                                placeholder="Search Staff"
                                className="input-field w-full"
                            />
                            {/* <Search size={14} className="absolute right-3 top-3 text-gray-400" /> */}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1">Payment Mode</label>
                        <select
                            name="paymentMethod"
                            value={filters.paymentMethod}
                            onChange={handleFilterChange}
                            className="input-field w-full"
                        >
                            <option value="">All</option>
                            <option value="Cash">Cash</option>
                            <option value="UPI">GPay</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Banner */}
            <div className="card bg-gradient-to-r from-orange-500 to-red-500 text-white border-none shadow-sm pb-8 pt-8">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-orange-100 text-sm font-bold uppercase tracking-wide">Total Sales (Filtered)</p>
                        <h2 className="text-4xl font-bold mt-1">₹ {totalAmount.toLocaleString()}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-orange-100 text-sm font-bold">{filteredSales.length} Entries</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container table-scroll" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Staff Name</th>
                                <th>Items / Remarks</th>
                                <th>Payment</th>
                                <th className="text-center">Status</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSales.map((sale) => {
                                const isEdited = new Date(sale.updatedAt).getTime() > new Date(sale.createdAt).getTime();
                                return (
                                    <tr key={sale._id} className="hover:bg-gray-50">
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700">
                                                    {new Date(sale.date).toLocaleDateString('en-GB')}
                                                </span>
                                                <span className="text-xs text-muted">
                                                    {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-medium text-gray-800">
                                                {sale.soldBy?.name || 'Unknown'}
                                            </span>
                                            <span className="block text-xs text-muted">
                                                {sale.soldBy?.username}
                                            </span>
                                        </td>
                                        <td>
                                            {sale.items.map(i => i.name).join(', ')}
                                        </td>
                                        <td>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sale.paymentMethod === 'Cash'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {sale.paymentMethod === 'UPI' ? 'GPay' : sale.paymentMethod || 'Cash'}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            {isEdited && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                                    Edited
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-right font-bold text-lg text-gray-800">
                                            ₹ {sale.totalAmount}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        No sales found for the selected filter.
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

export default ManagerStallSales;
