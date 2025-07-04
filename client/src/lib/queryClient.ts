import { QueryClient, QueryKey } from "@tanstack/react-query";

const defaultQueryFn = async ({ queryKey }: { queryKey: QueryKey }) => {
  const [url, params] = queryKey as [string, Record<string, any>?];
  
  // Ensure URL is properly formatted
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided to query');
  }

  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let finalUrl = url;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      finalUrl += `?${searchParams.toString()}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(finalUrl, {
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: Server took too long to respond. Please try again.');
    }
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// API request function for mutations
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    console.log('apiRequest called with:', { url, options });
    
    const token = localStorage.getItem('auth_token');
    console.log('Auth token exists:', !!token);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log('Making fetch request with headers:', headers);
    
    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (fetchError: any) {
      console.error('Fetch error occurred:', fetchError);
      throw new Error(`Network error: ${fetchError.message || 'Failed to fetch'}`);
    }

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('Error response text:', text);
      throw new Error(`${response.status}: ${text}`);
    }

    const result = await response.json();
    console.log('Successful response:', result);
    return result;
  } catch (error) {
    console.error('apiRequest error:', error);
    throw error;
  }
};
