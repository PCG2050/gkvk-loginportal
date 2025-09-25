import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasicAuthService } from '../../core/services/basic-auth.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import * as jwt_decode from 'jwt-decode';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit{
  loginObj: any = {
    email: '',
    password: ''
  };
  rememberMe: boolean = false;
  passwordPattern: string = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$';
  isLoading:boolean = false;

  router = inject(Router);
  authService = inject(BasicAuthService);
  localStorage = inject(LocalStorageService);

  loginError: string | null = null;
  showPassword: boolean = false;
  route = inject(ActivatedRoute);

  ngOnInit(): void {
    const refreshFlag = 'loginPageRefreshed';

        
        if (sessionStorage.getItem(refreshFlag) === null) {
            
            sessionStorage.setItem(refreshFlag, 'true');

            window.location.reload(); 
        } 
  }
  onLogin() {
    this.loginError = null;
this.isLoading = true;
    this.authService.login({ email: this.loginObj.email, password: this.loginObj.password }).subscribe({
      next: (res => {
        //had to be changed to session storage
        this.localStorage.set('authtoken', res.accessToken);
        this.localStorage.set('refreshToken', res.refreshToken);
        this.localStorage.set('role', res.role)
        this.localStorage.set('instituteId', res.instituteId)
        this.router.navigateByUrl("/dashboard");
        console.log(res);
        const token = res.accessToken;
        if (token) {
          const decodedToken: any = jwt_decode.jwtDecode(token);
          console.log(decodedToken);
          const role = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          const userId = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
          console.log(userId);
          console.log('Role:', role);
          this.localStorage.set('role',role);
          this.localStorage.set('userId',userId)
          this.localStorage.set('organizationId', (decodedToken.organization));
          console.log(res.role)        
        } else {
          console.log('No token found');
        }
        this.isLoading = false
      }),
      error: (err) => {
        if (err.error && typeof err.error === 'object' && err.error.error) {
          this.loginError = err.error.error;
        } else if (err.error && typeof err.error === 'string') {
          try {
            const parsed = JSON.parse(err.error);
            this.loginError = parsed.error || 'Login failed';
          } catch {
            this.loginError = err.error;
          }
        } else {
          this.loginError = 'Invalid credentials or server error.';
        }
      }
    });
    this.isLoading = false;
  }
  togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

getPasswordFieldType(): string {
  return this.showPassword ? 'text' : 'password';
}

getPasswordIcon(): string {
  return this.showPassword ? 'bi-eye' : 'bi-eye-slash';
}
onSelectRememberMe(event:any){
  const val = event.target.checked;
  console.log(val);
  this.localStorage.set('rememberMe',val);
}
}
