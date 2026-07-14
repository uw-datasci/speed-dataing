import { createSlice } from '@reduxjs/toolkit';

export interface UserData {
  name: string;
  userStatus?: string;
  hasPaid?: boolean;
  faculty?: string;
  term?: string;
  heardFromWhere?: string;
  isEmailVerified?: boolean;
  memberIdeas?: string;
  isCheckedIn?: boolean;
  isIncomplete?: boolean;
  createdAt?: string;
  updatedAt?: string;
  watIAM?: string;
  email: string;
  paymentLocation?: string;
  paymentMethod?: string;
  verifier?: string;
  eventList?: string[];
  isMathSocMember?: boolean;
  id?: string;
  role?: string;
  isAdmin?: boolean;
}

interface UserState {
  data: UserData | null;
  loading: boolean;
}

const initialState: UserState = {
  data: null,
  loading: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.data = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.data = null;
      state.loading = false;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = userSlice.actions;
export default userSlice.reducer; 