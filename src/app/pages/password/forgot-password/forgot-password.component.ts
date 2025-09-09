import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormControlName, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { PasswordService } from '../../../core/services/password.service';
import { Subscription, takeWhile, timer } from 'rxjs';
import { RouterModule } from '@angular/router';
import { NgOtpInputComponent } from 'ng-otp-input';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, NgOtpInputComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnInit {

  private service = inject (PasswordService);
  private timerSubscription : Subscription | undefined;

  countDownSeconds : number = 0;
  canResendOtp : boolean = false;
  //response messages
  //to disable and enable
  errorMsg: boolean = false;
  successMsg: boolean = false;
  //display text
  errorText: string = '';
  successText: string = '';

  //disabling resend till timer stops
  isResendLinkDisabled : boolean = true;

  //disabling or hiding reset password div untill otp verified
  disabledResetPasswordDiv:boolean = false;

  isVerifyOTPDivDisabled:boolean = true;
  isVerifyOTPBtnDisabled:boolean = true;
  countDownTime: string = '10:00'; // initial value for 10 minutes


forgotPasswordForm = new FormGroup({
  email : new FormControl('',[Validators.required])
})
verifyOTPForm = new FormGroup({
  email : new FormControl('',[Validators.required]),
  otp : new FormControl('',[Validators.required]),
  newPassword : new FormControl('',[Validators.required]),
  confirmPassword : new FormControl('',[Validators.required])
})
sendEmail(){
  console.log('test');
        this.startOtpTimer();
  const emailData = {
    email :this.forgotPasswordForm.controls.email.value
  };
  localStorage.setItem('email', this.forgotPasswordForm.controls.email.value || '');
  console.log(emailData);
  this.service.forgotPassword(emailData).subscribe({
    next:(res:any)=>{
      console.log(res);
    },
    error:(err:any)=>{
      console.log(err);
    }
  })
}
private formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

startOtpTimer(duration: number = 600): void {
        this.countDownSeconds = duration;
        this.canResendOtp = false;

        this.timerSubscription = timer(0, 1000) // Emit every 1 second
          .pipe(
            takeWhile(() => this.countDownSeconds >= 0) // Stop when countdown reaches 0
          )
          .subscribe(() => {
  if (this.countDownSeconds > 0) {
    this.isResendLinkDisabled = true;
    this.countDownSeconds--;

    // ✅ Update the formatted time here
    this.countDownTime = this.formatTime(this.countDownSeconds);
  } else {
    this.isResendLinkDisabled = false;
    this.canResendOtp = true;
    this.countDownTime = '00:00'; // Show final value

    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
});

      }
      verifyOTP(){
        const resetData = {
          email : localStorage.getItem('email'),
          otp : this.verifyOTPForm.controls.otp.value,
        }
        console.log(resetData);
        
        this.service.verifyOtp(resetData).subscribe({
          next:(res:any)=>{
            console.log(res);
            this.isVerifyOTPDivDisabled = false;
            this.disabledResetPasswordDiv = true;
            alert('Verified Email successfully');
          },
          error:(err:any)=>{
            alert('Please enter valid otp'+ JSON.stringify(err));
            console.log(err);
            console.log(err.error.remainingAttempts); 
          }
        })
      }
      // Call this method when the "Resend OTP" button is clicked
      resendOtp(): void {
        const resendOtpMail ={
          email : localStorage.getItem('email')
        }

        this.service.resendOtp(resendOtpMail).subscribe({
          next:(res:any)=>{
            console.log(res);
            alert("Successfully sent OTP to your registered mail, Please check your mail")
          }
        })
        this.startOtpTimer(); 
      }
      
      ngOnDestroy(): void {
        if (this.timerSubscription) {
          this.timerSubscription.unsubscribe();
        }
      }
      
      setResponseMessage(message:string , isSuccess:boolean){
        if(isSuccess){
          this.successMsg = true;
          this.successText =message;
          this.errorMsg = false;
        }
        else{
          this.errorMsg = true;
          this.errorText = message;
          this.successMsg = false;
        }
      }
      resetPassword(){
        const newPassword = {
          email : localStorage.getItem('email'),
          otp : this.verifyOTPForm.controls.otp.value,
          newPassword : this.verifyOTPForm.controls.newPassword.value,
          confirmPassword : this.verifyOTPForm.controls.confirmPassword.value
        }
        this.service.resetPassword(newPassword).subscribe({
          next:(res:any)=>{
            console.log(res);
            alert('Password reset successfull');
          },
          error:(err:any)=>{
            console.log(err);
            alert('failed to reset password' + err);
          }
        })
      }
      ngOnInit(): void {
    this.verifyOTPForm.get('otp')?.valueChanges.subscribe(value => {
      this.isVerifyOTPBtnDisabled = !this.verifyOTPForm.get('otp')?.valid;
    });
      }
}
