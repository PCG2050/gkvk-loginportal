// src/app/interceptors/auth.interceptor.ts
// import { HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const token = localStorage.getItem('authtoken'); // Or sessionStorage
  
//   if (token) {
//     const cloned = req.clone({
//       headers: req.headers.set('Authorization', `Bearer ${token}`)
//     });
//     return next(cloned);
//   }
  
//   return next(req);
// };