import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getSales, createSale } from '../../utils/api';
import { Sale } from '../../types/index';

interface SaleState {
  sales: Sale[];
  loading: boolean;
  error: string | null;
}

const initialState: SaleState = {
  sales: [],
  loading: false,
  error: null,
};

export const fetchSales = createAsyncThunk(
  'sales/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSales();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales');
    }
  }
);

export const addSale = createAsyncThunk(
  'sales/create',
  async (saleData: Partial<Sale>, { rejectWithValue }) => {
    try {
      const response = await createSale(saleData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create sale');
    }
  }
);

const saleSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSales.fulfilled, (state, action: PayloadAction<Sale[]>) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addSale.fulfilled, (state, action: PayloadAction<Sale>) => {
        state.sales.unshift(action.payload);
      });
  },
});

export default saleSlice.reducer;

