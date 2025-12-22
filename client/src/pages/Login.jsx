import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { User, Lock, Loader } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            if (user.role === 'counter') navigate('/counter');
            else if (user.role === 'manager') navigate('/manager');
            else if (user.role === 'superadmin') navigate('/admin');
            else if (user.role === 'stall') navigate('/stall');
            else navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh', backgroundColor: 'var(--background-color)' }}>
                <Loader className="animate-spin" style={{ color: 'var(--secondary-color)', width: 40, height: 40 }} />
            </div>
        );
    }

    return (
        <div className="login-wrapper">
            <div className="login-card">

                {/* Header */}
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <img src="images.png" alt="" style={{ height: '50px' }} />
                        <img src="ai.png" alt="" style={{ height: '70px' }} />
                    </div>
                    <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                        Secure Login Portal
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div
                        style={{
                            marginBottom: '1.5rem',
                            padding: '0.9rem 1rem',
                            backgroundColor: '#fee2e2',
                            borderRadius: '0.75rem',
                            borderLeft: '4px solid #ef4444',
                            color: '#991b1b',
                            fontSize: '0.9rem'
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

                    {/* Username */}
                    <div>
                        <label
                            htmlFor="username"
                            style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#374151'
                            }}
                        >
                            Username
                        </label>

                        <div style={{ position: 'relative' }}>
                            <User
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }}
                                size={20}
                            />

                            <input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                marginBottom: '0.35rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#374151'
                            }}
                        >
                            Password
                        </label>

                        <div style={{ position: 'relative' }}>
                            <Lock
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af'
                                }}
                                size={20}
                            />

                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-field"
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        className="btn-primary w-full"
                        style={{
                            marginTop: '0.5rem',
                            height: '48px',
                            fontSize: '1rem',
                            borderRadius: '12px'
                        }}
                    >
                        Sign In
                    </button>
                </form>

                {/* Footer */}
                <div
                    className="text-center text-xs text-muted"
                    style={{ marginTop: '2rem' }}
                >
                    &copy; 2025 ശ്രീനാഗരാജ ക്ഷേത്ര മാനേജ്മെന്റ് സിസ്റ്റം. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
