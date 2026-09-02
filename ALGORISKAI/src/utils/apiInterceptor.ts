const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(init?.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // We need to pass the headers back in a way that doesn't break if init is undefined
  const newInit: RequestInit = { ...init, headers };

  const response = await originalFetch(input, newInit);

  if (response.status === 401) {
    // Dispatch a custom event to notify the app to logout
    window.dispatchEvent(new Event('auth-unauthorized'));
  }

  return response;
};

export {};
