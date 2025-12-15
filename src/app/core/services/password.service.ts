import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  constructor() { }

  private httpClient = inject(HttpClient);
  private endpoint = Endpoints.user;
  private token = localStorage.getItem('authtoken')
  forgotPassword(userData:any){
    const headers = new HttpHeaders({
  'Content-Type': 'application/json'
});
    return this.httpClient.post(`${this.endpoint}/forgot-password`,userData,{headers})
  }
  resetPassword(password:any){
const headers = new HttpHeaders({
  'Content-Type': 'application/json'
});
return this.httpClient.post(`${this.endpoint}/reset-password`,password,{headers})
  }

  verifyOtp(verifyOtpData:any){
    const headers = new HttpHeaders({
  'Content-Type': 'application/json'
});
return this.httpClient.post(`${this.endpoint}/verify-reset-otp`,verifyOtpData)
  }
  resendOtp(otp:any){
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.httpClient.post(`${this.endpoint}/resend-reset-otp`, otp, {headers})
  }
}
