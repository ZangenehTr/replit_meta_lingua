import { QueryClient } from "@tanstack/react-query";
import apiClient from "./apiClient";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const { data } = await apiClient.get(queryKey[0] as string);
        return data;
      },
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
