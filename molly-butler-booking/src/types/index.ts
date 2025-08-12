export interface Room {
  id: string;
  name: string;
  type: 'historic' | 'mountain-view' | 'family-cabin';
  description: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  roomNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface Reservation {
  id: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestStreet?: string;
  guestCity?: string;
  guestState?: string;
  guestZipCode?: string;
  room?: Room;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  confirmationNumber: string;
  createdAt: string;
  updatedAt: string;
  nights?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface BookingFormData {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestStreet?: string;
  guestCity?: string;
  guestState?: string;
  guestZipCode?: string;
  specialRequests?: string;
}

export interface DashboardStats {
  totalReservations: number;
  monthlyReservations: number;
  confirmedReservations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalRooms: number;
  occupancyRate: string;
}

export interface APIResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}