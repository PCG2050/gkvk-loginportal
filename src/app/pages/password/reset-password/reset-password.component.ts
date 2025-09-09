import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
resetPassword = new FormGroup({
  password : new FormControl('',[Validators.required]),
  confirmPassword : new FormControl('',[Validators.required])
})
changePassword(){
  const newPassword={
    email :'',
    otp : ''
  }
}
}
