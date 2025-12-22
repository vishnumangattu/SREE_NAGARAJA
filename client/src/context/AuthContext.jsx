import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });
        localStorage.setItem('user', JSON.stringify(data));
        if (data.activityId) localStorage.setItem('activityId', data.activityId);
        setUser(data);
        return data;
    };

    const logout = async () => {
        const activityId = localStorage.getItem('activityId');
        if (activityId) {
            try {
                // Fire and forget logout call
                await api.post('/auth/logout', { activityId });
            } catch (err) {
                console.error("Logout log failed", err);
            }
            localStorage.removeItem('activityId');
        }
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
