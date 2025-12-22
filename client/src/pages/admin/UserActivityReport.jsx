import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, Clock } from 'lucide-react';

const UserActivityReport = () => {
    const [activeUsers, setActiveUsers] = useState([]);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [activityReport, setActivityReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/auth/active-users');
            setActiveUsers(data);
            setLoading(false);
            fetchReport(reportDate);
        } catch (error) {
            console.error("Failed to fetch activity data", error);
            setLoading(false);
        }
    };

    const fetchReport = async (date) => {
        try {
            const { data } = await api.get(`/auth/activity-report?date=${date}`);
            setActivityReport(data);
        } catch (error) {
            console.error("Report fetch failed", error);
        }
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setReportDate(newDate);
        fetchReport(newDate);
    };

    if (loading) return <div>Loading report...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock /> User Activity Center
            </h1>

            {/* Active Users List */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Currently Logged In ({activeUsers.length})
                </h3>
                <div className="flex flex-wrap" style={{ gap: '0.5rem' }}>
                    {activeUsers.length === 0 ? <p className="text-muted text-sm">No users currently active.</p> :
                        activeUsers.map(session => (
                            <div key={session._id} style={{ padding: '0.5rem 1rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '0.875rem', border: '1px solid #bae6fd' }}>
                                <strong>{session.user?.name}</strong> <span style={{ fontSize: '0.75rem' }}>({new Date(session.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* Daily Activity Report */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#fcfcfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem' }}>Daily Login/Logout Report</h2>
                    <input
                        type="date"
                        value={reportDate}
                        onChange={handleDateChange}
                        className="p-1 border rounded"
                        style={{ fontSize: '0.875rem' }}
                    />
                </div>
                <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: '500px', overflowY: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Login Time</th>
                                <th>Logout Time</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityReport.map((log) => {
                                const login = new Date(log.loginTime);
                                const logout = log.logoutTime ? new Date(log.logoutTime) : null;
                                const duration = logout ? ((logout - login) / 1000 / 60).toFixed(0) + ' mins' : 'Active';

                                return (
                                    <tr key={log._id}>
                                        <td className="font-semibold">{log.user?.name || 'Unknown'}</td>
                                        <td><span className="badge text-xs">{log.user?.role}</span></td>
                                        <td>{login.toLocaleTimeString()}</td>
                                        <td>{logout ? logout.toLocaleTimeString() : <span className="text-green-600 font-bold">Active</span>}</td>
                                        <td>{duration}</td>
                                    </tr>
                                );
                            })}
                            {activityReport.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted p-4">No activity found for this date.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserActivityReport;
