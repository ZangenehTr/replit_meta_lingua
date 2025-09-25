// E-commerce TypeScript interfaces for book purchasing system
import type { Book, Cart, CartItem, Order, OrderItem, UserAddress } from '@shared/schema';

// Enhanced interfaces with computed properties for UI
export interface EnhancedBook extends Book {
  formattedPrice: string;
  isInCart?: boolean;
  cartQuantity?: number;
}

export interface EnhancedCartItem extends CartItem {
  book: Book;
  subtotal: number;
  formattedSubtotal: string;
}

export interface EnhancedCart extends Omit<Cart, 'items'> {
  items: EnhancedCartItem[];
  total_items: number;
  total_amount: number;
  formattedTotal: string;
  shipping_cost: number;
  tax_amount: number;
}

export interface EnhancedOrder extends Order {
  items: OrderItemWithBook[];
  formattedTotal: string;
  canReorder: boolean;
  canDownload: boolean;
  shipping_address?: UserAddress;
}

export interface OrderItemWithBook extends OrderItem {
  book: Book;
  formattedPrice: string;
}

// Checkout flow interfaces
export interface CheckoutStep {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
  isDisabled: boolean;
}

export interface CheckoutData {
  customer_info: {
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
  };
  shipping_address: UserAddress;
  payment_method: 'wallet' | 'card' | 'cash';
  order_notes?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'wallet' | 'card' | 'cash';
  title: string;
  description: string;
  icon: string;
  available: boolean;
  balance?: number;
}

// Order filters for history page
export interface OrderFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// API Response types
export interface BookApiResponse {
  success: boolean;
  data: Book[];
  total?: number;
  message?: string;
}

export interface CartApiResponse {
  success: boolean;
  data: EnhancedCart;
  message?: string;
}

export interface OrderApiResponse {
  success: boolean;
  data: EnhancedOrder[];
  total?: number;
  message?: string;
}

export interface CheckoutApiResponse {
  success: boolean;
  data: {
    order_id: number;
    total_amount: number;
    status: string;
  };
  message?: string;
}

export interface AddressApiResponse {
  success: boolean;
  data: UserAddress[];
  message?: string;
}

// Form validation schemas
export interface CheckoutFormData {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  payment_method: 'wallet' | 'card' | 'cash';
  order_notes?: string;
  address_id?: number;
  save_address?: boolean;
}

// Utility functions type
export interface EcommerceUtils {
  formatPrice: (amount: number, currency?: string) => string;
  calculateCartTotal: (items: EnhancedCartItem[]) => number;
  getOrderStatusColor: (status: string) => string;
  getOrderStatusText: (status: string) => string;
  canReorderOrder: (order: EnhancedOrder) => boolean;
}