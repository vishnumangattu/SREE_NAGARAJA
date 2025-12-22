import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const VazhipadManager = () => {
    const [vazhipads, setVazhipads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVazhipad, setEditingVazhipad] = useState(null);
    const [formData, setFormData] = useState({ name: '', code: '', rate: '', status: 'active', requiresDateConfirmation: false });

    useEffect(() => {
        fetchVazhipads();
    }, []);

    const fetchVazhipads = async () => {
        try {
            const { data } = await api.get('/vazhipads');
            setVazhipads(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching vazhipads", error);
            setLoading(false);
        }
    };

    const handleOpenModal = (vazhipad = null) => {
        if (vazhipad) {
            setEditingVazhipad(vazhipad);
            setFormData({ ...vazhipad });
        } else {
            setEditingVazhipad(null);
            setFormData({ name: '', code: '', rate: '', status: 'active', requiresDateConfirmation: false });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVazhipad) {
                await api.put(`/vazhipads/${editingVazhipad._id}`, formData);
            } else {
                await api.post('/vazhipads', formData);
            }
            fetchVazhipads();
            handleCloseModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this Vazhipad?')) {
            try {
                await api.delete(`/vazhipads/${id}`);
                fetchVazhipads();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1>Manage Vazhipads</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn-primary flex items-center"
                >
                    <Plus size={16} className="mr-2" /> Add Vazhipad
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container table-scroll" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th className="text-right">Rate</th>
                                <th className="text-center">Status</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vazhipads.map((v) => (
                                <tr key={v._id}>
                                    <td style={{ fontFamily: 'monospace' }} className="text-muted">{v.code}</td>
                                    <td className="font-bold">{v.name}</td>
                                    <td className="text-right">₹ {v.rate}</td>
                                    <td className="text-center">
                                        <span className={`badge ${v.status === 'active' ? 'badge--active' : 'badge--inactive'}`}>
                                            {v.status}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center" style={{ gap: '15px' }}>
                                            <button onClick={() => handleOpenModal(v)} className="action-edit" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(v._id)} className="action-delete" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="card modal-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2>{editingVazhipad ? 'Edit Vazhipad' : 'Add Vazhipad'}</h2>
                            <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Code</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Rate</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={formData.rate}
                                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Status</label>
                                <select
                                    className="input-field"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center p-2 bg-gray-50 rounded">
                                <input
                                    type="checkbox"
                                    id="dateConfirm"
                                    className="mr-3 h-5 w-5 accent-orange-600"
                                    checked={formData.requiresDateConfirmation || false}
                                    onChange={e => setFormData({ ...formData, requiresDateConfirmation: e.target.checked })}
                                />
                                <label htmlFor="dateConfirm" className="text-sm font-bold text-gray-700 select-none cursor-pointer">
                                    Require Date Confirmation?
                                </label>
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary flex items-center">
                                    <Save size={16} className="mr-2" /> Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VazhipadManager;
