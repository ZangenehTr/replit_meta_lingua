import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  credits: number;
  streakDays: number;
  totalLessons: number;
  preferences?: any;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;

      try {
        const response = await apiClient.get("/users/me");
        return response.data;
      } catch (error: any) {
        // Only clear tokens if it's an auth error, not a network error
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
        }
        return null;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry auth errors, but retry network errors up to 3 times
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post("/auth/login", credentials);
      const data = response.data;
      
      // Store both tokens
      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiClient.post("/auth/register", userData);
      const data = response.data;
      
      // Store both tokens
      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await apiClient.put("/users/me/preferences", preferences);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    queryClient.setQueryData(["/api/users/me"], null);
    queryClient.clear();
    window.location.href = "/auth";
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    updatePreferences: updatePreferencesMutation.mutate,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
  };
}
