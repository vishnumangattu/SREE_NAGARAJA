import { useState } from 'react';
import { X, Lock, Check } from 'lucide-react';
import api from '../utils/api';

const ChangePasswordModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = formData;

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/change-password', { currentPassword, newPassword });
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.message || 'Failed to update password');
        }
    };

    // Inline Styles
    const overlayStyle = {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
    };

    const modalStyle = {
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '28rem', // max-w-md
        padding: '1.5rem',
        position: 'relative'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.5rem',
        borderRadius: '0.25rem',
        border: '1px solid #d1d5db', // gray-300
        outline: 'none',
        marginTop: '0.25rem'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#374151', // gray-700
        marginBottom: '0.25rem'
    };

    const buttonStyle = {
        width: '100%',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        color: 'white',
        fontWeight: 600,
        backgroundColor: loading ? '#9ca3af' : '#f97316', // gray-400 : orange-500
        cursor: loading ? 'not-allowed' : 'pointer',
        border: 'none',
        transition: 'background-color 0.2s',
        marginTop: '1rem'
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        color: '#6b7280',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock color="#f97316" size={24} /> Change Password
                </h2>

                {success ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', color: '#16a34a' }}>
                        <Check size={48} style={{ marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>Password Changed Successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {error && (
                            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label style={labelStyle}>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                style={inputStyle}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={buttonStyle}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePasswordModal;
