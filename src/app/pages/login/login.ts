import { Component, inject } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasicAuthService } from '../../core/services/basic-auth.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import * as jwt_decode from 'jwt-decode';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginObj: any = {
    email: '',
    password: ''
  };
  rememberMe: boolean = false;
  passwordPattern: string = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$';

  router = inject(Router);
  authService = inject(BasicAuthService);
  localStorage = inject(LocalStorageService);

  loginError: string | null = null;
  showPassword: boolean = false;
  onLogin() {
    this.loginError = null;

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
