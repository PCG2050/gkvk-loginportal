// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth.guard';
import { RoleGuard } from './shared/guards/role.guard';

// Import your page components
import { LoginComponent } from './pages/login/login.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { MainLayoutComponent } from './pages/main-layout/main-layout.component'; // Your main layout
import { SuperAdminDashboardComponent } from './pages/super-admin-dashboard/super-admin-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { UnitHeadDashboardComponent } from './pages/unit-head-dashboard/unit-head-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default redirect to login
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // Main Layout for authenticated users
  {
    path: '',
    component: MainLayoutComponent, // This component will contain <router-outlet> for nested routes
    canActivate: [AuthGuard], // Only authenticated users can access anything under this layout
    children: [
      // Super Admin Routes
      {
        path: 'super-admin',
        canActivate: [RoleGuard],
        data: { roles: ['SUPERADMIN'] }, // Define required role(s)
        children: [
          { path: 'dashboard', component: SuperAdminDashboardComponent },
          {
            path: 'institutes',
            loadComponent: () => import('./features/super-admin/pages/institute-management/institute-management.component').then(m => m.InstituteManagementComponent),
            // You might add more specific role checks here if needed, e.g., data: { roles: ['SUPERADMIN_INSTITUTE_MANAGER'] }
          },
          {
            path: 'themes',
            loadComponent: () => import('./features/super-admin/pages/theme-configuration/theme-configuration.component').then(m => m.ThemeConfigurationComponent),
          },
          // ... more Super Admin specific routes
        ]
      },

      // Admin Routes
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'SUPERADMIN'] }, // Admin can also be SuperAdmin
        children: [
          { path: 'dashboard', component: AdminDashboardComponent },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/pages/user-management/user-management.component').then(m => m.UserManagementComponent),
          },
          // ... more Admin specific routes
        ]
      },

      // Unit Head Routes
      {
        path: 'unit-head',
        canActivate: [RoleGuard],
        data: { roles: ['UNITHEAD', 'ADMIN', 'SUPERADMIN'] }, // UnitHead can also be Admin/SuperAdmin
        children: [
          { path: 'dashboard', component: UnitHeadDashboardComponent },
          {
            path: 'units',
            loadComponent: () => import('./features/unit-head/pages/unit-dashboard/unit-dashboard.component').then(m => m.UnitDashboardComponent),
          },
          // ... more Unit Head specific routes
        ]
      },

      // Generic/Default Dashboard for authenticated users (if no specific role matches or for common users)
      { path: 'default-dashboard', component: AdminDashboardComponent }, // Or a generic user dashboard
      { path: '**', redirectTo: 'default-dashboard' } // Redirect any unmatched authenticated route to a default dashboard
    ]
  },

  // Catch-all for non-existent routes (must be last)
  { path: '**', component: NotFoundComponent }
];