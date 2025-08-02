// src/app/core/interceptors/auth.interceptor.ts

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, filter, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. Add Access Token to the request
    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      request = this.addToken(request, accessToken);
    }

    // 2. Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // 401 Unauthorized: Token might be expired or invalid.
          // Attempt to refresh the token.
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          // 403 Forbidden: User is authenticated but doesn't have permission.
          // Redirect to an unauthorized page.
          console.error('403 Forbidden: Access denied to this resource.', error);
          this.router.navigate(['/unauthorized']);
          return throwError(() => error);
        }
        // For other errors, just re-throw
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null); // Clear previous token in subject

      // Call the AuthService to refresh the token
      return this.authService.refreshToken().pipe(
        switchMap((newAccessToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newAccessToken); // Emit the new token
          // Retry the original request with the new token
          return next.handle(this.addToken(request, newAccessToken));
        }),
        catchError((refreshError) => {
          // If refresh token fails (e.g., refresh token expired or invalid),
          // log out the user and redirect to login
          this.isRefreshing = false;
          this.authService.logout(); // This will navigate to /login
          return throwError(() => refreshError); // Propagate the error
        })
      );
    } else {
      // If a refresh is already in progress, wait for the new token
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}
