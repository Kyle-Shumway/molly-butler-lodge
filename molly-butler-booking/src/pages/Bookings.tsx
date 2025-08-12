import React, { useState, useEffect } from 'react';
import { roomsAPI, reservationsAPI } from '../services/api';
import { Room, BookingFormData } from '../types';
import './Bookings.css';

const Bookings: React.FC = () => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    roomId: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    guestStreet: '',
    guestCity: '',
    guestState: '',
    guestZipCode: '',
    specialRequests: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getAll();
      const roomsData = response.data || [];
      setAllRooms(roomsData);
      setRooms(roomsData);
      setError(null);
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Failed to load rooms. Please try again later.');
      }
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    if (new Date(checkIn) < new Date()) {
      alert('Check-in date cannot be in the past');
      return;
    }

    setCheckingAvailability(true);
    setError(null);

    try {
      // Check availability for each room
      const availabilityPromises = allRooms.map(async (room) => {
        try {
          const response = await roomsAPI.checkAvailability(room.id, checkIn, checkOut);
          return {
            room,
            available: response.data.available
          };
        } catch (error) {
          console.error(`Error checking availability for room ${room.id}:`, error);
          return {
            room,
            available: false
          };
        }
      });

      const results = await Promise.all(availabilityPromises);
      const availableRooms = results
        .filter(result => result.available && result.room.capacity >= guests)
        .map(result => result.room);

      setRooms(availableRooms);
      setFilteredRooms(availableRooms);
      
      if (availableRooms.length === 0) {
        setError('No rooms available for the selected dates and guest count. Please try different dates.');
      } else {
        setError(null);
      }

      // Update booking form with selected dates and guests
      setBookingFormData(prev => ({ ...prev, checkIn, checkOut, guests }));
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError('Failed to check availability. Please try again.');
      }
      console.error('Error checking availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSelectRoom = (room: Room) => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates first');
      return;
    }
    
    setSelectedRoom(room);
    setBookingFormData(prev => ({ 
      ...prev, 
      roomId: room.id,
      checkIn: checkIn || prev.checkIn,
      checkOut: checkOut || prev.checkOut,
      guests: guests || prev.guests
    }));
    setShowBookingForm(true);
  };

  const validateBookingForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!bookingFormData.guestFirstName.trim()) {
      errors.guestFirstName = 'First name is required';
    }
    if (!bookingFormData.guestLastName.trim()) {
      errors.guestLastName = 'Last name is required';
    }
    if (!bookingFormData.guestEmail.trim()) {
      errors.guestEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingFormData.guestEmail)) {
      errors.guestEmail = 'Please enter a valid email address';
    }
    if (!bookingFormData.guestPhone.trim()) {
      errors.guestPhone = 'Phone number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    setError(null);

    // Validate form
    if (!validateBookingForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Transform form data to match backend API structure
      const reservationData = {
        roomId: bookingFormData.roomId,
        checkIn: bookingFormData.checkIn,
        checkOut: bookingFormData.checkOut,
        guests: bookingFormData.guests,
        guestInfo: {
          firstName: bookingFormData.guestFirstName,
          lastName: bookingFormData.guestLastName,
          email: bookingFormData.guestEmail,
          phone: bookingFormData.guestPhone,
          address: {
            street: bookingFormData.guestStreet || '',
            city: bookingFormData.guestCity || '',
            state: bookingFormData.guestState || '',
            zipCode: bookingFormData.guestZipCode || ''
          }
        },
        specialRequests: bookingFormData.specialRequests || ''
      };
      
      const response = await reservationsAPI.create(reservationData);
      setConfirmationNumber(response.data.confirmationNumber);
      setShowBookingForm(false);
      // Reset form
      setBookingFormData({
        roomId: '',
        checkIn: '',
        checkOut: '',
        guests: 2,
        guestFirstName: '',
        guestLastName: '',
        guestEmail: '',
        guestPhone: '',
        guestStreet: '',
        guestCity: '',
        guestState: '',
        guestZipCode: '',
        specialRequests: ''
      });
      setCheckIn('');
      setCheckOut('');
      setGuests(2);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(error.response?.data?.message || 'Failed to create reservation');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowBookingForm(false);
    setFormErrors({});
    setError(null);
  };

  const handleShowAllRooms = () => {
    setRooms(allRooms);
    setFilteredRooms([]);
    setError(null);
    setCheckIn('');
    setCheckOut('');
    setGuests(2);
  };

  const calculateNights = () => {
    if (bookingFormData.checkIn && bookingFormData.checkOut) {
      const checkInDate = new Date(bookingFormData.checkIn);
      const checkOutDate = new Date(bookingFormData.checkOut);
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    return selectedRoom ? nights * selectedRoom.basePrice : 0;
  };

  return (
    <div className="bookings-page">
      <div className="bookings-container">
        <h1 className="bookings-title">Book Your Stay</h1>
        
        {/* Quick Booking Form */}
        <div className="booking-form-section">
          <h2 className="booking-form-title">Check Availability</h2>
          <div className="booking-form-grid">
            <div className="form-field">
              <label className="form-label">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Guests</label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
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
              <button 
                className="btn-check-availability"
                onClick={handleCheckAvailability}
                disabled={checkingAvailability}
              >
                {checkingAvailability ? 'Checking...' : 'Check Availability'}
              </button>
            </div>
          </div>
        </div>

        {/* Show results info and reset button */}
        {filteredRooms.length > 0 && (
          <div className="availability-results">
            <div className="results-info">
              <p>Showing {rooms.length} available room{rooms.length !== 1 ? 's' : ''} for {checkIn} to {checkOut}</p>
              <button className="btn-show-all" onClick={handleShowAllRooms}>
                Show All Rooms
              </button>
            </div>
          </div>
        )}

        {/* Room Types */}
        {loading && <div className="loading">Loading rooms...</div>}
        {checkingAvailability && <div className="loading">Checking availability...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <img 
                  src={room.images[0] || "/Historic-Molly-Butler-Lodge-And-Restaurant-Greer-AZ.jpg"} 
                  alt={room.name} 
                  className="room-image"
                />
                <div className="room-content">
                  <h3 className="room-title">{room.name}</h3>
                  <p className="room-description">{room.description}</p>
                  <p className="room-capacity">Capacity: {room.capacity} guests</p>
                  <div className="room-amenities">
                    {room.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="amenity-tag">{amenity}</span>
                    ))}
                  </div>
                  <div className="room-footer">
                    <span className="room-price">${room.basePrice}/night</span>
                    <button 
                      className="btn-select-room"
                      onClick={() => handleSelectRoom(room)}
                    >
                      Select Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="help-section">
          <p className="help-text">Need help with your booking?</p>
          <a 
            href="tel:928-735-7226" 
            className="help-link"
          >
            Call us at (928) 735-7226
          </a>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book {selectedRoom.name}</h2>
              <button 
                className="modal-close"
                onClick={handleModalClose}
              >
                ×
              </button>
            </div>
            
            <div className="booking-summary">
              <p><strong>Check-in:</strong> {new Date(bookingFormData.checkIn).toLocaleDateString()}</p>
              <p><strong>Check-out:</strong> {new Date(bookingFormData.checkOut).toLocaleDateString()}</p>
              <p><strong>Guests:</strong> {bookingFormData.guests}</p>
              <p><strong>Nights:</strong> {calculateNights()}</p>
              <p><strong>Total:</strong> ${calculateTotal()}</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleBookingFormSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    value={bookingFormData.guestFirstName}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestFirstName: e.target.value }))}
                    className={`form-input ${formErrors.guestFirstName ? 'error' : ''}`}
                    required
                  />
                  {formErrors.guestFirstName && <span className="field-error">{formErrors.guestFirstName}</span>}
                </div>
                <div className="form-field">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    value={bookingFormData.guestLastName}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestLastName: e.target.value }))}
                    className={`form-input ${formErrors.guestLastName ? 'error' : ''}`}
                    required
                  />
                  {formErrors.guestLastName && <span className="field-error">{formErrors.guestLastName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={bookingFormData.guestEmail}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestEmail: e.target.value }))}
                    className={`form-input ${formErrors.guestEmail ? 'error' : ''}`}
                    required
                  />
                  {formErrors.guestEmail && <span className="field-error">{formErrors.guestEmail}</span>}
                </div>
                <div className="form-field">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    value={bookingFormData.guestPhone}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestPhone: e.target.value }))}
                    className={`form-input ${formErrors.guestPhone ? 'error' : ''}`}
                    required
                  />
                  {formErrors.guestPhone && <span className="field-error">{formErrors.guestPhone}</span>}
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  value={bookingFormData.guestStreet}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, guestStreet: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-row three-cols">
                <div className="form-field">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    value={bookingFormData.guestCity}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestCity: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    value={bookingFormData.guestState}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestState: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    value={bookingFormData.guestZipCode}
                    onChange={(e) => setBookingFormData(prev => ({ ...prev, guestZipCode: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Special Requests</label>
                <textarea
                  value={bookingFormData.specialRequests}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
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
                  {submitting ? 'Creating Reservation...' : 'Book Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      {confirmationNumber && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="confirmation-message">
              <h2>Reservation Confirmed!</h2>
              <p>Your confirmation number is:</p>
              <p className="confirmation-number">{confirmationNumber}</p>
              <p>We've sent a confirmation email to your email address.</p>
              <button 
                className="btn-primary"
                onClick={() => setConfirmationNumber(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;