// Type definitions for the CRM app

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Employee' | 'Finance Manager' | 'Trainer';
  phone?: string;
  department?: string;
  isActive: boolean;
  avatar?: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  source?: 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Email' | 'Other';
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed' | 'Lost';
  assignedTo?: User;
  notes?: string;
  value: number;
  createdBy: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Sale {
  _id: string;
  leadId?: Lead;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  assignedTo: User;
  saleDate: Date;
  notes?: string;
  createdBy: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DC {
  _id: string;
  saleId: Sale;
  employeeId: User;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  deliveryDate: Date;
  status: 'Scheduled' | 'In Transit' | 'Delivered' | 'Failed' | 'Cancelled';
  deliveryNotes?: string;
  deliveryProof?: string;
  deliveredAt?: Date;
  createdBy: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Payment {
  _id: string;
  saleId?: Sale;
  customerName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Debit Card' | 'Online Payment' | 'Other';
  paymentDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  referenceNumber?: string;
  description?: string;
  receipt?: string;
  approvedBy?: User;
  approvedAt?: Date;
  rejectedBy?: User;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdBy: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Warehouse {
  _id: string;
  productName: string;
  productCode?: string;
  category?: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitPrice: number;
  unit: string;
  location?: string;
  supplier?: string;
  lastRestocked?: Date;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Expense {
  _id: string;
  title: string;
  description?: string;
  category: 'Office Supplies' | 'Travel' | 'Marketing' | 'Utilities' | 'Salary' | 'Rent' | 'Other';
  amount: number;
  date: Date;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Debit Card' | 'Other';
  receipt?: string;
  employeeId?: User;
  department?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: User;
  approvedAt?: Date;
  createdBy: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Training {
  _id: string;
  title: string;
  description?: string;
  trainerId: User;
  assignedTo: User[];
  startDate: Date;
  endDate: Date;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  completionStatus: Array<{
    employeeId: User;
    status: 'Not Started' | 'In Progress' | 'Completed';
    completedAt?: Date;
    score?: number;
  }>;
  materials?: string[];
  createdBy: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: User['role'];
  phone?: string;
  department?: string;
}

export type RootStackParamList = {
  Main: undefined;
  Training: undefined;
  Warehouse: undefined;
  Expenses: undefined;
};

export type RootTabParamList = {
  Dashboard: undefined;
  Leads: undefined;
  DC: undefined;
  Employees: undefined;
  Payments: undefined;
  Reports: undefined;
};

