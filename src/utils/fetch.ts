/**
 * React Native compatible fetch utilities
 * AbortSignal.timeout() is not available in React Native, so we implement our own
 */

// Create a timeout signal that's compatible with React Native
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  // Check if AbortSignal.timeout is available (web environment)
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return (AbortSignal as any).timeout(timeoutMs);
  }
  
  // Fallback for React Native
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  // Clean up timeout if the signal is aborted by other means
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });
  
  return controller.signal;
}

// Fetch with timeout wrapper
export async function fetchWithTimeout(
  url: string, 
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const timeoutSignal = createTimeoutSignal(timeout);
  
  // If user provided their own signal, we need to combine them
  let finalSignal = timeoutSignal;
  if (fetchOptions.signal) {
    // Create a new controller that aborts when either signal aborts
    const combinedController = new AbortController();
    
    const abortHandler = () => combinedController.abort();
    timeoutSignal.addEventListener('abort', abortHandler);
    fetchOptions.signal.addEventListener('abort', abortHandler);
    
    finalSignal = combinedController.signal;
  }
  
  return fetch(url, {
    ...fetchOptions,
    signal: finalSignal
  });
}