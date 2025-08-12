import React, { useState, useEffect } from 'react';
import { authAPI, reservationsAPI } from '../services/api';
import { User, DashboardStats, Reservation } from '../types';
import './Admin.css';

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setIsLoggedIn(true);
      fetchDashboardData();
    } catch (error) {
      localStorage.removeItem('authToken');
      setIsLoggedIn(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, reservationsResponse] = await Promise.all([
        reservationsAPI.getStats(),
        reservationsAPI.getAll({ limit: 10 })
      ]);
      setStats(statsResponse.data);
      setReservations(reservationsResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError('Failed to load dashboard data');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      setIsLoggedIn(true);
      await fetchDashboardData();
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setStats(null);
    setReservations([]);
    setCredentials({ username: '', password: '' });
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="login-card">
            <h1 className="login-title">Admin Login</h1>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-field">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <div className="dashboard-user">
            <span>Welcome, {user?.firstName} {user?.lastName}</span>
            <button
              onClick={handleLogout}
              className="btn-logout"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-label">Total Reservations</h3>
            <p className="stat-value">{stats?.totalReservations || 0}</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-label">Occupancy Rate</h3>
            <p className="stat-value">{stats?.occupancyRate || '0'}%</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-label">Revenue This Month</h3>
            <p className="stat-value">${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="reservations-section">
          <div className="reservations-header">
            <h2 className="reservations-title">Recent Reservations</h2>
          </div>
          <div className="reservations-table-container">
            <table className="reservations-table">
              <thead className="table-header">
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.guestFirstName} {reservation.guestLastName}</td>
                    <td>{reservation.room?.name || `Room ${reservation.roomId}`}</td>
                    <td>{new Date(reservation.checkIn).toLocaleDateString()}</td>
                    <td>{new Date(reservation.checkOut).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${reservation.status}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-table-action">Edit</button>
                        <button className="btn-table-action danger">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{textAlign: 'center'}}>No reservations found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;