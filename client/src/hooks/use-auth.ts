import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
    queryFn: () => {
      // Check if we have a demo token
      const token = localStorage.getItem("auth_token");
      if (token === "demo_token_12345") {
        return {
          id: 1,
          email: "ahmad.rezaei@example.com",
          password: "",
          firstName: "Ahmad",
          lastName: "Rezaei",
          role: "student",
          phoneNumber: "+989123456789",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          isActive: true,
          preferences: { theme: "light", language: "en", notifications: true },
          credits: 12,
          streakDays: 15,
          totalLessons: 45,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      // If no demo token, try the API
      return fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(res => res.ok ? res.json() : null);
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // For demo purposes, check credentials and set token directly
      if (credentials.email === "ahmad.rezaei@example.com" && credentials.password === "password123") {
        const mockToken = "demo_token_12345";
        localStorage.setItem("auth_token", mockToken);
        return { access_token: mockToken, user: { email: credentials.email } };
      }
      
      // Otherwise try the API
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token);
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
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: any) => {
      const response = await apiRequest("PUT", "/api/users/me/preferences", preferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });

  const logout = () => {
    localStorage.removeItem("auth_token");
    queryClient.setQueryData(["/api/users/me"], null);
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    updatePreferences: updatePreferencesMutation.mutate,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
  };
}
