import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  constructor() { }

  private httpClient = inject(HttpClient);
  private endpoint = Endpoints.user;

  /**
   * Initiate password reset (sends OTP to email)
   * No auth required - user doesn't have token yet
   */
  forgotPassword(userData: any) {
    return this.httpClient.post(`${this.endpoint}/forgot-password`, userData);
  }

  /**
   * Reset password with new password
   * No auth required - user can't authenticate without password
   */
  resetPassword(password: any) {
    return this.httpClient.post(`${this.endpoint}/reset-password`, password);
  }

  /**
   * Verify OTP sent to email
   * No auth required - part of password reset flow
   */
  verifyOtp(verifyOtpData: any) {
    return this.httpClient.post(`${this.endpoint}/verify-reset-otp`, verifyOtpData);
  }

  /**
   * Resend OTP if user didn't receive it
   * No auth required - part of password reset flow
   */
  resendOtp(otp: any) {
    return this.httpClient.post(`${this.endpoint}/resend-reset-otp`, otp);
  }
}
