import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getTicketsApi,
  getTicketByIdApi,
  createTicketApi,
  updateTicketApi,
  deleteTicketApi,
  updateTicketStatusApi,
  assignTicketApi,
  addCommentApi,
} from '../../api/tickets.api';
import { Ticket, PaginatedTickets } from '../../types';

interface TicketsState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  total: number;
  page: number;
  totalPages: number;
  listLoading: boolean;
  detailLoading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  commentLoading: boolean;
  statusLoading: boolean;
  assignLoading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  tickets: [],
  selectedTicket: null,
  total: 0,
  page: 1,
  totalPages: 0,
  listLoading: false,
  detailLoading: false,
  createLoading: false,
  updateLoading: false,
  commentLoading: false,
  statusLoading: false,
  assignLoading: false,
  error: null,
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params: object | undefined, { rejectWithValue }) => {
    try {
      const response = await getTicketsApi(params);
      return response.data.data as PaginatedTickets;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await getTicketByIdApi(id);
      return response.data.data as Ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ticket');
    }
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (data: object, { rejectWithValue }) => {
    try {
      const response = await createTicketApi(data);
      return response.data.data as Ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create ticket');
    }
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ id, data }: { id: string; data: object }, { rejectWithValue }) => {
    try {
      const response = await updateTicketApi(id, data);
      return response.data.data as Ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update ticket');
    }
  }
);

export const deleteTicket = createAsyncThunk(
  'tickets/deleteTicket',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteTicketApi(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete ticket');
    }
  }
);

export const updateTicketStatus = createAsyncThunk(
  'tickets/updateStatus',
  async ({ id, data }: { id: string; data: { status: string; note?: string } }, { rejectWithValue }) => {
    try {
      const response = await updateTicketStatusApi(id, data);
      return response.data.data as Ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const assignTicket = createAsyncThunk(
  'tickets/assign',
  async ({ id, data }: { id: string; data: { assignedTo: string } }, { rejectWithValue }) => {
    try {
      const response = await assignTicketApi(id, data);
      return response.data.data as Ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign ticket');
    }
  }
);

export const addComment = createAsyncThunk(
  'tickets/addComment',
  async ({ id, data }: { id: string; data: { text: string } }, { rejectWithValue }) => {
    try {
      const response = await addCommentApi(id, data);
      return response.data.data as Ticket;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Tickets
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.listLoading = false;
        state.tickets = action.payload.tickets;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Ticket By Id
    builder
      .addCase(fetchTicketById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      });

    // Create Ticket
    builder
      .addCase(createTicket.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.createLoading = false;
        state.tickets.unshift(action.payload);
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      });

    // Update Ticket
    builder
      .addCase(updateTicket.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Delete Ticket
    builder
      .addCase(deleteTicket.pending, (state) => {
        state.listLoading = true; // mapped to listLoading as it affects list view
        state.error = null;
      })
      .addCase(deleteTicket.fulfilled, (state, action) => {
        state.listLoading = false;
        state.tickets = state.tickets.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteTicket.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload as string;
      });

    // Update Status
    builder
      .addCase(updateTicketStatus.pending, (state) => {
        state.statusLoading = true;
        state.error = null;
      })
      .addCase(updateTicketStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateTicketStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.payload as string;
      });

    // Assign Ticket
    builder
      .addCase(assignTicket.pending, (state) => {
        state.assignLoading = true;
        state.error = null;
      })
      .addCase(assignTicket.fulfilled, (state, action) => {
        state.assignLoading = false;
        const index = state.tickets.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(assignTicket.rejected, (state, action) => {
        state.assignLoading = false;
        state.error = action.payload as string;
      });

    // Add Comment
    builder
      .addCase(addComment.pending, (state) => {
        state.commentLoading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.commentLoading = false;
        if (state.selectedTicket?._id === action.payload._id) {
          state.selectedTicket.comments = action.payload.comments;
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.commentLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedTicket } = ticketsSlice.actions;
export default ticketsSlice.reducer;
