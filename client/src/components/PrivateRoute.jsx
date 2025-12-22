import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100vh', backgroundColor: 'var(--background-color)' }}>
                {/* Simple spinner if lucide not imported, but let's assume we can import or just text */}
                <div style={{ color: 'var(--secondary-color)', fontWeight: 'bold' }}>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />; // Or unauthorized page
    }

    return <Outlet />;
};

export default PrivateRoute;
