// src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor'; // Import your interceptor
import { AuthService } from './core/services/auth.service'; // Import your auth service
import { AuthGuard } from './shared/gaurds/auth.guard'; // Import your guards
import { RoleGuard } from './shared/gaurds/role.guard'; // Import your role guard

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])), // Register the interceptor
    AuthService, // Provide AuthService
    AuthGuard,   // Provide AuthGuard
    RoleGuard    // Provide RoleGuard
  ]
};