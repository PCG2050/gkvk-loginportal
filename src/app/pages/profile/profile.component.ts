import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule,ReactiveFormsModule, FormsModule],
  standalone:true,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private service = inject(UserService);
  userId = localStorage.getItem('userId')
  user:any;
  editProfileModal:boolean = false;
  profileForm!: FormGroup;

   
  ngOnInit(): void {
    this.profileForm = new FormGroup({
    firstName: new FormControl('',[Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern('^[A-Za-z]*$')]),
    lastName: new FormControl('',[Validators.required, Validators.maxLength(50), Validators.pattern('^[A-Za-z\s]+$')]),
    email : new FormControl('',[Validators.required, Validators.email]),
    phone : new FormControl('',[Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10), Validators.maxLength(10)]),
  });
    console.log(this.userId);
    this.getUserDetails();
      console.log('profileForm:', this.profileForm);
  }
  getUserDetails() {
    const userId = Number(this.userId)
    this.service.getUser(userId).subscribe({
      next: (res: any) => {
        this.user= res;
        console.log(this.user);
        
      },
      error: (err: any) => {
        console.log(err);
      }
    }
    )
  }
  openUserDetailsEditModel(){
    this.editProfileModal = true;
  this.profileForm.patchValue({
    firstName: this.user.firstName,
    lastName : this.user.lastName,
    email : this.user.email,
    phone : this.user.phone
  })
  }
  closeModal(){
    this.editProfileModal = false;
  }
  saveProfile(){
    const id = Number(this.userId)
    const userData ={
      id : id,
      firstName : this.profileForm.value.firstName || '',
      lastName : this.profileForm.value.lastName,
      email : this.profileForm.value.email,
      phone : this.profileForm.value.phone,
      role : 3
    }
    console.log();

    this.service.updateUser(id, userData).subscribe({
      next:(res:any)=>{
        console.log(res);
      },
      error:(err:any)=>{
        console.log(err);
      }
    })
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/profileIcon.png';
  }
}
