// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment'; // Adjust the path as necessary

// Define a simple User interface for the frontend
interface User {
  email: string;
  role: string; // e.g., 'SUPERADMIN', 'ADMIN', 'UNITHEAD'
  organizationId?: string; // If applicable
  // other claims from JWT payload
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private accessToken: string | null = null;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private authApiUrl = `${environment.apiUrl}/api/Account`; // Your auth API base URL

  constructor(private http: HttpClient, private router: Router) {
    // Attempt to load token and user from sessionStorage on service initialization
    // For refresh tokens, they would ideally be in HttpOnly cookies, not accessible here.
    this.accessToken = sessionStorage.getItem('access_token');
    const userJson = sessionStorage.getItem('current_user');
    const user = userJson ? JSON.parse(userJson) : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.getValue();
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public isLoggedIn(): boolean {
    return !!this.accessToken && !!this.currentUserSubject.getValue();
  }

  public hasRole(requiredRoles: string[]): boolean {
    const user = this.currentUserSubject.getValue();
    if (!user || !user.role) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.authApiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Assuming your backend returns { accessToken: '...', user: { email, role, ... } }
        // The 'user' object here would be derived from JWT claims on the backend
        this.accessToken = response.accessToken;
        sessionStorage.setItem('access_token', response.accessToken);

        // Store user details (including role)
        const user: User = {
          email: response.user.email,
          role: response.user.role,
          organizationId: response.user.organizationId // If present
        };
        this.currentUserSubject.next(user);
        sessionStorage.setItem('current_user', JSON.stringify(user));

        // Redirect based on role
        this.redirectToRoleDashboard(user.role);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Login failed:', error);
        // Clear any partial state on login failure
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // This method would be called by the interceptor for 401 errors
  // In a real app, this would hit a backend endpoint that uses the HttpOnly Refresh Token
  // to issue a new Access Token.
  refreshToken(): Observable<string> {
    console.log('Attempting to refresh access token...');
    // Make a request to your backend's refresh token endpoint.
    // The HttpOnly refresh token cookie will automatically be sent by the browser.
    return this.http.post<any>(`${this.authApiUrl}/refresh-token`, {}).pipe(
      tap(response => {
        const newAccessToken = response.accessToken;
        this.accessToken = newAccessToken;
        sessionStorage.setItem('access_token', newAccessToken);
        console.log('Access token refreshed successfully.');
      }),
      catchError(error => {
        console.error('Failed to refresh token:', error);
        this.logout(); // Force logout if refresh fails
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.accessToken = null;
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    // In a real app, you might also call a backend logout endpoint to invalidate tokens
    this.router.navigate(['/login']);
    console.log('User logged out.');
  }

  private redirectToRoleDashboard(role: string): void {
    switch (role.toUpperCase()) {
      case 'SUPERADMIN':
        this.router.navigate(['/super-admin/dashboard']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'UNITHEAD':
        this.router.navigate(['/unit-head/dashboard']);
        break;
      default:
        this.router.navigate(['/default-dashboard']); // Fallback for other roles or generic users
        break;
    }
  }
}