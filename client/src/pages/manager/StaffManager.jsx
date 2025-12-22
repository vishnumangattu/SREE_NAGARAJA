import { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { Plus, Trash2, X, Save, User as UserIcon } from 'lucide-react';

const StaffManager = () => {
    const { user: currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'counter' });

    useEffect(() => {
        fetchUsers();
    }, [currentUser]); // Re-fetch if user changes, though unlikely without page reload

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');

            // Filter based on role
            let filtered = data;
            if (currentUser?.role === 'superadmin') {
                // Hide other superadmins (or all superadmins including self, usually self is displayed in header not here)
                filtered = data.filter(u => u.role !== 'superadmin');
            } else if (currentUser?.role === 'manager') {
                // Hide superadmins and other managers
                filtered = data.filter(u => u.role !== 'superadmin' && u.role !== 'manager');
            }

            setUsers(filtered);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching users", error);
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ name: '', username: '', password: '', role: 'counter' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this User?')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1>Manage Staff</h1>
                <button
                    onClick={handleOpenModal}
                    className="btn-primary flex items-center"
                >
                    <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Staff
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {users.map((user) => (
                    <div key={user._id} className="card flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div style={{
                                    width: '3rem', height: '3rem', backgroundColor: '#f3f4f6',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', marginRight: '1rem', color: '#6b7280'
                                }}>
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem' }}>{user.name}</h3>
                                    <p className="text-muted text-sm">@{user.username}</p>
                                </div>
                            </div>
                            {/* Double check protections: Managers shouldn't see delete for protected roles anyway due to filter */}
                            <button onClick={() => handleDelete(user._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }} className="hover:text-danger">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                                padding: '0.25rem 0.75rem', backgroundColor: '#eff6ff',
                                color: '#1d4ed8', borderRadius: '9999px', fontSize: '0.75rem',
                                fontWeight: 600, textTransform: 'uppercase'
                            }}>
                                {user.role}
                            </span>
                            <span className="text-xs text-muted">
                                ID: {user._id.slice(-6)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2>Add New Staff</h2>
                            <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Username</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Role</label>
                                <select
                                    className="input-field"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="counter">Counter User</option>
                                    <option value="stall">Stall User</option>

                                    {/* Only Superadmin can create Managers or other Superadmins */}
                                    {currentUser?.role === 'superadmin' && (
                                        <>
                                            <option value="manager">Manager</option>
                                            <option value="superadmin">Super Admin</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary flex items-center">
                                    <Save size={16} style={{ marginRight: '0.5rem' }} /> Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManager;
