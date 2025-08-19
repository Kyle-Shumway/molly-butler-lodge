import React, { useState, useEffect, useCallback } from 'react';
import { authAPI, reservationsAPI } from '../services/api';
import { User, DashboardStats, Reservation } from '../types';
import './Admin.css';

// Helper function to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateValue: string | Date): string => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      setIsLoggedIn(true);
      fetchDashboardData();
    } catch (error) {
      localStorage.removeItem('authToken');
      setIsLoggedIn(false);
    }
  }, [fetchDashboardData]);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

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

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation({ ...reservation });
    setShowEditModal(true);
    setError(null);
  };


  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updateData = {
        guestFirstName: editingReservation.guestFirstName,
        guestLastName: editingReservation.guestLastName,
        guestEmail: editingReservation.guestEmail,
        guestPhone: editingReservation.guestPhone,
        guestStreet: editingReservation.guestStreet || '',
        guestCity: editingReservation.guestCity || '',
        guestState: editingReservation.guestState || '',
        guestZipCode: editingReservation.guestZipCode || '',
        checkIn: editingReservation.checkIn,
        checkOut: editingReservation.checkOut,
        guests: editingReservation.guests,
        specialRequests: editingReservation.specialRequests || '',
        status: editingReservation.status
      };

      const response = await reservationsAPI.update(editingReservation.id, updateData);
      
      // Update the reservation in the local state
      setReservations(prev => 
        prev.map(res => 
          res.id === editingReservation.id 
            ? { ...res, ...updateData }
            : res
        )
      );
      
      if (response.data.emailSent) {
        setSuccessMessage('Reservation updated successfully! A summary of changes has been sent to the guest.');
      } else {
        setSuccessMessage('Reservation updated successfully!');
      }
      
      setTimeout(() => {
        setShowEditModal(false);
        setEditingReservation(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(error.response?.data?.message || 'Failed to update reservation');
      }
    } finally {
      setSubmitting(false);
    }
  };


  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingReservation(null);
    setError(null);
    setSuccessMessage(null);
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
                        <button 
                          className="btn-table-action"
                          onClick={() => handleEditReservation(reservation)}
                          disabled={reservation.status === 'cancelled'}
                        >
                          Edit
                        </button>
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

      {/* Edit Reservation Modal */}
      {showEditModal && editingReservation && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Reservation</h2>
              <button 
                className="modal-close"
                onClick={handleModalClose}
              >
                ×
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
            
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    value={editingReservation.guestFirstName}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, guestFirstName: e.target.value } : null)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    value={editingReservation.guestLastName}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, guestLastName: e.target.value } : null)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={editingReservation.guestEmail}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, guestEmail: e.target.value } : null)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    value={editingReservation.guestPhone}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, guestPhone: e.target.value } : null)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Check-in</label>
                  <input
                    type="date"
                    value={formatDateForInput(editingReservation.checkIn)}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, checkIn: e.target.value } : null)}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Check-out</label>
                  <input
                    type="date"
                    value={formatDateForInput(editingReservation.checkOut)}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, checkOut: e.target.value } : null)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Guests</label>
                  <select
                    value={editingReservation.guests}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, guests: Number(e.target.value) } : null)}
                    className="form-select"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={3}>3 Guests</option>
                    <option value={4}>4 Guests</option>
                    <option value={5}>5+ Guests</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select
                    value={editingReservation.status}
                    onChange={(e) => setEditingReservation(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                    className="form-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Special Requests</label>
                <textarea
                  value={editingReservation.specialRequests || ''}
                  onChange={(e) => setEditingReservation(prev => prev ? { ...prev, specialRequests: e.target.value } : null)}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;