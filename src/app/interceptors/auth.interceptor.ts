import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth Interceptor
 *
 * Automatically adds Authorization header with Bearer token to all HTTP requests,
 * except for endpoints that don't require authentication (login, password reset, etc.)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // List of endpoints that should NOT have the Authorization header
  const excludedEndpoints = [
    '/api/Auth/login',
    '/api/Users/forgot-password',
    '/api/Users/reset-password',
    '/api/Users/verify-reset-otp',
    '/api/Users/resend-reset-otp',
    '/api/Locations/states'  // Public location endpoints
    //also here the sub routes like /districts is also covered as we are using 
  ];

  // Check if the current request URL matches any excluded endpoint
  const isExcluded = excludedEndpoints.some(endpoint => req.url.includes(endpoint));

  // If excluded, pass the request without modification
  if (isExcluded) {
    return next(req);
  }

  // Get token from localStorage
  const token = localStorage.getItem('authtoken');

  // If token exists, clone request and add Authorization header
  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedRequest);
  }

  // If no token, pass request without Authorization header
  return next(req);
};
