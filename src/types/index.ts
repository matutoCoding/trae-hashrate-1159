export type StudioStatus = 'available' | 'busy' | 'maintenance';

export interface StudioEquipment {
  name: string;
  quantity: number;
}

export interface Studio {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  images: string[];
  area: number;
  capacity: number;
  status: StudioStatus;
  equipment: StudioEquipment[];
  tags: string[];
  address: string;
}

export type RateType = 'peak' | 'offpeak' | 'normal';

export interface TimeRate {
  id: string;
  type: RateType;
  label: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  weekdays: number[];
}

export type SlotStatus = 'available' | 'booked' | 'waitlist' | 'maintenance' | 'expired';

export interface TimeSlot {
  id: string;
  studioId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  rateType: RateType;
  price: number;
  bookingId?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'released';

export interface BookingSegment {
  startTime: string;
  endTime: string;
  rateType: RateType;
  rateLabel: string;
  hours: number;
  pricePerHour: number;
  subtotal: number;
}

export interface Booking {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  segments: BookingSegment[];
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  checkInTime?: string;
  releaseTime?: string;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'confirmed' | 'expired' | 'cancelled';

export interface WaitlistItem {
  id: string;
  studioId: string;
  studioName: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  position: number;
  status: WaitlistStatus;
  createdAt: string;
  notifiedAt?: string;
  expiresAt?: string;
}

export type BillStatus = 'pending' | 'paid' | 'refunded' | 'cancelled';

export interface Bill {
  id: string;
  bookingId: string;
  studioId: string;
  studioName: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  segments: BookingSegment[];
  totalHours: number;
  totalAmount: number;
  status: BillStatus;
  paidAt?: string;
  createdAt: string;
}
