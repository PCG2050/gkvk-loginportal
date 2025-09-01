import { Component, inject, OnInit } from '@angular/core';
import { UserRole } from '../../../core/models/userRoles.model';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasicAuthService } from '../../../core/services/basic-auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
currentUser:UserRole = UserRole.UNDEFINED;
   showSignOutConfirm = false;
   private service = inject(BasicAuthService);
   private router = inject(Router);

// On login: store "Remember Me" value to determine if refresh token should store in local
   refreshTok:any;
   items =[
    {
      routeLink: 'signout',
      icon: 'bi bi-box-arrow-right',
      label: 'Sign Out',
      roles:[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.UNITHEAD]
    },
    {
      routeLink : 'Profile',
      icon : 'bi bi-person',
      label : 'Profile',
      roles: [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.UNITHEAD]
    }
   ]
   onSignOutClick(event: Event) {
  event.preventDefault(); // Prevent navigation
  this.showSignOutConfirm = true;
}
  confirmSignOut() {  
    this.showSignOutConfirm = false;
    // localStorage.removeItem('authtoken');
    const isRememberMeChecked = Boolean(localStorage.getItem('rememberMe'));
    const refreshToken = localStorage.getItem('refreshToken');
    console.log(refreshToken);
    
    if(isRememberMeChecked === true){
      this.refreshTok = refreshToken
    }
    if(isRememberMeChecked ===  false){
      this.refreshTok = refreshToken;
    }

    const refreshTokenString = {
      refreshToken:refreshToken
    }
    this.service.logOut(refreshTokenString).subscribe();
    this.router.navigateByUrl('/login',{replaceUrl: true}); // This replaces history
    localStorage.clear();
    sessionStorage.clear();
    alert("Logged out successfully");
  }

  cancelSignOut() {
    this.showSignOutConfirm = false;
  }
  ngOnInit(): void {
    const Role = localStorage.getItem('role');
    console.log(Role);
     if (
  Role !== null &&
  Object.values(UserRole).includes(Role as UserRole)
) {
  this.currentUser = Role as UserRole;
} else {
  this.currentUser = UserRole.UNDEFINED;
}
  }
}
