import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getLeads, createLead, updateLead } from '../../utils/api';
import { Lead } from '../../types/index';

interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
}

const initialState: LeadState = {
  leads: [],
  loading: false,
  error: null,
};

export const fetchLeads = createAsyncThunk(
  'leads/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getLeads();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leads');
    }
  }
);

export const addLead = createAsyncThunk(
  'leads/create',
  async (leadData: Partial<Lead>, { rejectWithValue }) => {
    try {
      const response = await createLead(leadData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create lead');
    }
  }
);

export const editLead = createAsyncThunk(
  'leads/update',
  async ({ id, data }: { id: string; data: Partial<Lead> }, { rejectWithValue }) => {
    try {
      const response = await updateLead(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update lead');
    }
  }
);

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeads.fulfilled, (state, action: PayloadAction<Lead[]>) => {
        state.loading = false;
        state.leads = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addLead.fulfilled, (state, action: PayloadAction<Lead>) => {
        state.leads.unshift(action.payload);
      })
      .addCase(editLead.fulfilled, (state, action: PayloadAction<Lead>) => {
        const index = state.leads.findIndex(lead => lead._id === action.payload._id);
        if (index !== -1) {
          state.leads[index] = action.payload;
        }
      });
  },
});

export default leadSlice.reducer;

