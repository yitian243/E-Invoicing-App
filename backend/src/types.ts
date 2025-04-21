/**
 * TypeScript types for Invoice Management System
 * Based on the provided ER diagram
 */

  /**
   * Business entity
   */
export interface Business {
    business_id: number;  // Primary Key
    business_name: string;
    tax_id: number;
    address: string;
    email: string;  // Used for login
    password_hash: string;
    default_currency: string;
    invoice_template: string;
  }
  
  /**
   * User entity
   */
  export interface User {
    id: number;  // Primary Key
    business_id: number;  // Foreign Key
    name: string;
    email: string;
    password: string;
    role: string;
    avatar: string;
    lastLogin: Date;
    createdAt: Date;
  }
  
  /**
   * Admin entity
   */
  export interface Admin {
    id: number;  // Primary Key
    name: string;
    permissions: string;
    description: string;
  }
  
  /**
   * Staff entity
   */
  export interface Staff {
    id: number;  // Primary Key
    name: string;
    permissions: string;
    description: string;
  }
  
  /**
   * Contact entity
   */
  export interface Contact {
    id: number;  // Primary Key
    business_id: number;  // Foreign Key
    name: string;
    email: string;
    phone: string;
    position: string;
    type: string;
    lastInteraction: Date;
    createdAt: Date;
  }
  
  /**
   * PaymentMethod entity
   */
  export interface PaymentMethod {
    id: number;  // Primary Key
    name: string;
    isActive: boolean;
    description: string;
  }
  
  /**
   * Payment entity
   */
  export interface Payment {
    id: number;  // Primary Key
    invoiceId: number;  // Foreign Key
    paymentDate: Date;
    amount: number;  // float
    method: string;
    reference: string;
    status: string;
    createdAt: Date;
  }
  
  /**
   * InvoiceStatus entity
   */
  export interface InvoiceStatus {
    id: number;  // Primary Key
    status: string;
    colour: string;
    description: string;
  }
  
  /**
   * Invoice entity
   */
  export interface Invoice {
    invoice_id: number;  // Primary Key
    business_id: number;  // Foreign Key
    notes: string;
    status: string;  // Enum: draft, sent, paid
    number: number;
    issuerBusinessId: number;  // Foreign Key
    recipientBusinessId: number;  // Foreign Key
    creatorUserId: number;  // Foreign Key
    issueDate: Date;
    dueDate: Date;
    subTotal: number;  // float
    taxAmount: number;  // float
    totalAmount: number;  // float
    terms: string;
    sentDate: Date | null;
    paidDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * InvoiceItem entity
   */
  export interface InvoiceItem {
    id: number;  // Primary Key
    invoiceId: number;  // Foreign Key
    quantity: number;
    description: string;
    unitPrice: number;  // float
    taxRate: number;  // float
    amount: number;  // float
    taxAmount: number;  // float
    totalAmount: number;  // float
  }
  
  /**
   * Request types for API endpoints
   */
  
  export interface CreateBusinessRequest {
    business_name: string;
    tax_id: number;
    address: string;
    email: string;
    password: string;
    default_currency?: string;
    invoice_template?: string;
  }
  
  export interface CreateUserRequest {
    business_id: number;
    name: string;
    email: string;
    password: string;
    role: string;
    avatar?: string;
  }
  
  export interface CreateInvoiceRequest {
    business_id: number;
    notes?: string;
    issuerBusinessId: number;
    recipientBusinessId: number;
    creatorUserId: number;
    issueDate: Date;
    dueDate: Date;
    terms?: string;
    items: Array<{
      quantity: number;
      description: string;
      unitPrice: number;
      taxRate: number;
    }>;
  }
  
  export interface CreatePaymentRequest {
    invoiceId: number;
    amount: number;
    method: string;
    reference?: string;
    paymentDate?: Date;
  }
  
  /**
   * Response types
   */
  
  export interface ErrorResponse {
    error: string;
    code?: number;
    details?: any;
  }
  
  export interface SuccessResponse<T> {
    success: boolean;
    data: T;
  }
  
  /**
   * Auth types
   */
  
  export interface LoginRequest {
    email: string;
    password: string;
    userType: 'business' | 'user' | 'admin' | 'staff';
  }
  
  export interface TokenPayload {
    id: number;
    email: string;
    role: string;
    business_id?: number;
  }
  
  export interface AuthResponse {
    token: string;
    user: User | Business | Admin | Staff;
  }