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
  password?: string;
  otp?: string;
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
    staleTime: 1 * 60 * 1000, // 1 minute - shorter cache to detect token changes faster
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      try {
        const response = await apiClient.post("/auth/login", credentials);
        const data = response.data;
        
        // Store both tokens - handle different response formats
        if (data.accessToken) {
          localStorage.setItem("auth_token", data.accessToken);
        } else if (data.auth_token) {
          localStorage.setItem("auth_token", data.auth_token);
        }
        
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        } else if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        
        return data;
      } catch (error: any) {
        // Properly throw the error so the auth page can display it
        const errorMessage = error.response?.data?.message || error.message || "Login failed";
        throw new Error(errorMessage);
      }
    },
    onSuccess: async (data) => {
      // Immediately invalidate and refetch the user data
      await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      await queryClient.refetchQueries({ queryKey: ["/api/users/me"] });
      
      // Redirect based on user role
      const userRole = data.user?.role || data.user_role;
      if (userRole?.toLowerCase() === 'student') {
        window.location.href = "/dashboard";  // Students use the unified dashboard
      } else {
        window.location.href = "/dashboard";  // All roles use unified dashboard
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiClient.post("/auth/register", userData);
      const data = response.data;
      
      // Store both tokens - handle different response formats
      if (data.accessToken) {
        localStorage.setItem("auth_token", data.accessToken);
      } else if (data.auth_token) {
        localStorage.setItem("auth_token", data.auth_token);
      }
      
      if (data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
      } else if (data.refresh_token) {
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
    // Navigate to login page instead of reloading to avoid connection issues
    window.location.href = '/auth';
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
