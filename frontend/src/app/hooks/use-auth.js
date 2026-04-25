import { useAuthStore } from "@/app/store/auth-store";

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    setSession,
    clearSession
  };
}
