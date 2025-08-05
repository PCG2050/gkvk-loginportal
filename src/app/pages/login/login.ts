import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasicAuthService } from '../../core/services/basic-auth.service';
import { LocalStorageService } from '../../core/services/local-storage.service';

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
  
  router = inject(Router);
  authService = inject(BasicAuthService);
  localStorage = inject(LocalStorageService);

  loginError: string | null = null;
  onLogin() {
    this.loginError = null;
   
    this.authService.login({email:this.loginObj.email,password:this.loginObj.password}).subscribe({
      next: (res => {
        //had to be changed to session storage
        this.localStorage.set('authtoken', res.accessToken);
        this.localStorage.set('refreshToken', res.refreshToken);
        this.router.navigateByUrl("/dashboard");
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
}
