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

  // Enhanced retry logic with progressive timeout
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      // Progressive timeout: shorter for first attempts, longer for retries
      const timeout = attempt === 0 ? 8000 : 12000 + (attempt * 3000);
      const timeoutId = setTimeout(() => {
        try {
          if (!controller.signal.aborted) {
            controller.abort('Request timeout');
          }
        } catch (abortError) {
          // Silently handle abort errors to prevent runtime error plugin
          console.debug('Abort signal handling:', abortError);
        }
      }, timeout);

      // Add keepalive for better connection persistence
      const response = await fetch(finalUrl, {
        headers,
        credentials: 'include',
        signal: controller.signal,
        keepalive: true,
        cache: 'no-cache',
      });

      // Clear timeout on successful response
      try {
        clearTimeout(timeoutId);
      } catch (clearError) {
        // Ignore timeout clear errors
        console.debug('Timeout clear error:', clearError);
      }

      if (!response.ok) {
        let errorText = 'Unknown error';
        try {
          const responseBody = await response.text();
          if (responseBody.trim()) {
            // Try to parse as JSON first
            try {
              const errorJson = JSON.parse(responseBody);
              errorText = errorJson.message || errorJson.error || responseBody;
            } catch {
              errorText = responseBody;
            }
          } else {
            errorText = `HTTP ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }
        throw new Error(`${response.status}: ${errorText}`);
      }

      let result;
      try {
        const text = await response.text();
        if (!text.trim()) {
          return null;
        }
        result = JSON.parse(text);
      } catch (parseError) {
        // Handle JSON parsing error gracefully
        console.warn(`JSON parse error for ${finalUrl}:`, parseError);
        throw new Error(`Invalid JSON response from server: ${finalUrl}`);
      }

      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry for client errors (4xx) or auth issues
      if (error instanceof Error && error.message.includes('403:') || error.message.includes('401:')) {
        throw error;
      }
      
      // Don't retry for AbortError (timeout) or signal errors
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('signal is aborted') ||
        error.message.includes('abort') ||
        error.message.includes('The user aborted a request')
      )) {
        console.debug('Request aborted:', error);
        throw new Error('Request timeout: Server took too long to respond. Please try again.');
      }
      
      // Enhanced retry logic for various network errors
      const isNetworkError = (
        (error instanceof TypeError && error.message === 'Failed to fetch') ||
        (error instanceof Error && error.message.includes('NetworkError')) ||
        (error instanceof Error && error.message.includes('fetch'))
      );
      
      if (isNetworkError && attempt < maxRetries) {
        // Progressive backoff: 500ms, 1.5s, 3s
        const backoffTime = 500 * Math.pow(2.5, attempt);
        console.warn(`Network error on attempt ${attempt + 1}/${maxRetries + 1} for ${finalUrl}. Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      
      if (isNetworkError) {
        throw new Error(`Network connectivity issue: Unable to reach server after ${maxRetries + 1} attempts. Please check your internet connection and try refreshing the page.`);
      }
      
      // Other errors, don't retry
      throw error;
    }
  }
  
  // If we get here, all retries failed
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('Unexpected error in fetch operation');
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      staleTime: 30000, // 30 seconds
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          return false;
        }
        // Retry network errors up to 2 times
        if (error instanceof Error && error.message.includes('Network')) {
          return failureCount < 2;
        }
        // Default retry for other errors
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Never retry mutations for auth errors
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          return false;
        }
        // Only retry network errors for mutations
        if (error instanceof Error && error.message.includes('Network')) {
          return failureCount < 1;
        }
        return false;
      },
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
    
    // Handle request body serialization
    const requestOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    // Properly serialize body to JSON if it's an object
    if (options.body !== undefined) {
      if (typeof options.body === 'string') {
        requestOptions.body = options.body;
      } else if (options.body instanceof FormData) {
        requestOptions.body = options.body;
        // Remove Content-Type header for FormData
        delete (requestOptions.headers as any)['Content-Type'];
      } else {
        try {
          requestOptions.body = JSON.stringify(options.body);
        } catch (error) {
          // Handle request body serialization error gracefully
          throw new Error('Invalid request body format');
        }
      }
    }

    let response;
    try {
      response = await fetch(finalUrl, requestOptions);
    } catch (fetchError: any) {
      // Handle fetch error gracefully
      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
      }
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout: Server took too long to respond. Please try again.');
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
        // Handle error response parsing gracefully
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      console.log('Error response text:', errorText);
      throw new Error(`${response.status}: ${errorText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      // Handle JSON parsing error gracefully
      // Return empty object if JSON parsing fails but response was successful
      return {};
    }
    
    console.log('Successful response:', result);
    return result;
  } catch (error) {
    // Handle API request error gracefully
    throw error;
  }
};
