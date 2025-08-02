// src/app/shared/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service'; // Adjust path

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const expectedRoles = route.data['roles'] as string[]; // Get roles from route data

    if (!expectedRoles || expectedRoles.length === 0) {
      return true; // No specific roles required, allow access (should be covered by AuthGuard)
    }

    const currentUser = this.authService.currentUserValue;

    if (currentUser && this.authService.hasRole(expectedRoles)) {
      return true; // User has one of the required roles, allow access
    } else {
      // User does not have the required role, redirect to unauthorized page
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}