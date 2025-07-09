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

  // Ensure URL is properly formatted as relative path
  let finalUrl = url.startsWith('/') ? url : `/${url}`;
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
    // Validate input parameters
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Ensure URL is properly formatted as relative path
    const finalUrl = url.startsWith('/') ? url : `/${url}`;
    
    const token = localStorage.getItem('auth_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    let response;
    try {
      response = await fetch(finalUrl, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (fetchError: any) {
      console.error('Fetch error occurred:', fetchError);
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
      }
      throw new Error(`Network error: ${fetchError.message || 'Failed to fetch'}`);
    }

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        errorText = await response.text();
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      console.log('Error response text:', errorText);
      throw new Error(`${response.status}: ${errorText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('Successful response:', result);
    return result;
  } catch (error) {
    console.error('apiRequest error:', error);
    throw error;
  }
};
