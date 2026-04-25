import { create } from "zustand";

const STORAGE_KEY = "contasolutions-auth";

const readStoredState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
};

const persistState = (state) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: state.token,
      user: state.user
    })
  );
};

export const authStorage = {
  getToken: () => readStoredState().token,
  clear: () => localStorage.removeItem(STORAGE_KEY)
};

export const useAuthStore = create((set) => ({
  ...readStoredState(),
  setSession: ({ token, user }) =>
    set(() => {
      const nextState = { token, user };
      persistState(nextState);
      return nextState;
    }),
  clearSession: () =>
    set(() => {
      authStorage.clear();
      return { token: null, user: null };
    })
}));
