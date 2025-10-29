import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api.config';
import {
  LoginCredentials,
  RegisterData,
  Lead,
  Sale,
  Payment,
  Expense,
} from '../types/index';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const login = (email: string, password: string) => {
  return api.post('/auth/login', { email, password });
};

export const register = (userData: RegisterData) => {
  return api.post('/auth/register', userData);
};

export const getMe = () => {
  return api.get('/auth/me');
};

// Leads API
export const getLeads = () => {
  return api.get<Lead[]>('/leads');
};

export const createLead = (leadData: Partial<Lead>) => {
  return api.post<Lead>('/leads/create', leadData);
};

export const updateLead = (id: string, leadData: Partial<Lead>) => {
  return api.put<Lead>(`/leads/${id}`, leadData);
};

// Sales API
export const getSales = () => {
  return api.get<Sale[]>('/sales');
};

export const createSale = (saleData: Partial<Sale>) => {
  return api.post<Sale>('/sales/create', saleData);
};

// Employees API
export const getEmployees = () => {
  return api.get('/employees');
};

// DC API
export const getDCs = () => {
  return api.get('/dc');
};

export const createDC = (dcData: Partial<any>) => {
  return api.post('/dc/create', dcData);
};

// Training API
export const getTrainings = () => {
  return api.get('/training');
};

export const assignTraining = (trainingData: any) => {
  return api.post('/training/assign', trainingData);
};

// Payments API
export const getPayments = () => {
  return api.get<Payment[]>('/payments');
};

export const createPayment = (paymentData: Partial<Payment>) => {
  return api.post<Payment>('/payments/create', paymentData);
};

// Warehouse API
export const getWarehouse = () => {
  return api.get('/warehouse');
};

export const updateStock = (stockData: any) => {
  return api.post('/warehouse/stock', stockData);
};

// Expenses API
export const getExpenses = () => {
  return api.get<Expense[]>('/expenses');
};

export const createExpense = (expenseData: Partial<Expense>) => {
  return api.post<Expense>('/expenses/create', expenseData);
};

// Reports API
export const getSalesReports = () => {
  return api.get('/reports/sales');
};

export default api;

