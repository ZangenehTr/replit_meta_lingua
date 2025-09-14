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
      // Progressive timeout: longer for complex queries and retries
      const timeout = attempt === 0 ? 30000 : 45000 + (attempt * 5000);
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
      }).catch(fetchError => {
        // Handle fetch errors to prevent unhandled promise rejections
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        // Convert network errors to a more user-friendly format
        if (fetchError.message === 'Failed to fetch') {
          throw new Error('Network connection error. Please check your internet connection.');
        }
        throw fetchError;
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

        // Handle auth errors specially to prevent unhandled rejections
        if (response.status === 401 || response.status === 403) {
          console.debug('Authentication error, not retrying:', response.status);
          const authError = new Error(`Authentication error: ${errorText}`);
          authError.name = 'AuthenticationError';
          throw authError;
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

      // Network connectivity issues - retry with exponential backoff
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('Connection reset') ||
          error.message.includes('ECONNRESET') ||
          error.code === 'ECONNRESET' ||
          error.message.includes('fetch')) {
        // Progressive backoff: 500ms, 1.5s, 3s
        const backoffTime = 500 * Math.pow(2.5, attempt);
        console.warn(`Network error on attempt ${attempt + 1}/${maxRetries + 1} for ${finalUrl}. Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }

      // Network connectivity issues handled above in retry logic

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
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }

        // Don't retry network errors too aggressively
        if (error && typeof error === 'object' && 'message' in error) {
          const message = error.message as string;
          if (message.includes('Failed to fetch') || 
              message.includes('Network request failed') ||
              message.includes('ECONNREFUSED')) {
            return failureCount < 1; // Only retry once for network errors
          }
        }

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 30000, // 30 seconds
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        return failureCount < 1;
      },
      throwOnError: false, // Also prevent mutation errors from causing runtime errors
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
      console.error('Fetch error details:', fetchError);

      if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection and try again.');
      }
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout: Server took too long to respond. Please try again.');
      }

      // Additional error handling for common network issues
      if (fetchError.message.includes('ECONNREFUSED')) {
        throw new Error('Connection refused: Server is not responding. Please try again later.');
      }
      if (fetchError.message.includes('NetworkError')) {
        throw new Error('Network error: Please check your internet connection.');
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