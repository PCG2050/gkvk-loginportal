import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('authtoken');

  // Don't add Authorization header to login endpoint
  if (req.url.includes('/api/Auth/login')) {
    return next(req);
  }

  // Add Authorization header to all other requests
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};