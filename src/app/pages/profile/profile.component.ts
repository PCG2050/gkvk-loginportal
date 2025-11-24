import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AzureStorageService } from '../../core/services/azure-storage.service';
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
  private azureStorage = inject(AzureStorageService);
  userId = localStorage.getItem('userId')
  user:any;
  editProfileModal:boolean = false;
  profileForm!: FormGroup;

  // Profile picture upload state
  isUploadingPhoto: boolean = false;
  uploadError: string | null = null;
  uploadSuccess: boolean = false;
  profileImageUrl: string | null = null;

   
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
        this.profileImageUrl = res.profileImageUrl || null;
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
        this.closeModal();
        this.getUserDetails(); // Refresh profile data
      },
      error:(err:any)=>{
        console.log(err);
      }
    })
  }

  /**
   * Handle profile photo upload
   * @param event - File input change event
   */
  async onPhotoUpload(event: any) {
    const file: File = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Reset states
    this.uploadError = null;
    this.uploadSuccess = false;
    this.isUploadingPhoto = true;

    try {
      console.log('📷 Uploading profile picture:', file.name);

      // Upload to Azure Blob Storage
      // Folder structure: {userId}/Profile/{timestamp}_{filename}
      const imageUrl = await this.azureStorage.uploadProfilePicture(file, this.userId!);

      console.log('✅ Profile picture uploaded:', imageUrl);

      // Update backend with new profile picture URL
      const userId = Number(this.userId);
      this.service.updateProfilePicture(userId, imageUrl).subscribe({
        next: (res: any) => {
          console.log('✅ Profile picture URL saved to database:', res);
          this.profileImageUrl = imageUrl;
          this.user.profileImageUrl = imageUrl;
          this.uploadSuccess = true;
          this.isUploadingPhoto = false;

          // Hide success message after 3 seconds
          setTimeout(() => {
            this.uploadSuccess = false;
          }, 3000);
        },
        error: (err: any) => {
          console.error('❌ Failed to save profile picture URL:', err);
          this.uploadError = 'Failed to save profile picture. Please try again.';
          this.isUploadingPhoto = false;
        }
      });

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      this.uploadError = error.message || 'Failed to upload profile picture. Please try again.';
      this.isUploadingPhoto = false;
    }
  }

  /**
   * Get the display profile image URL
   * Returns user's profile image or default avatar
   */
  getProfileImageUrl(): string {
    return this.profileImageUrl || this.user?.profileImageUrl || 'assets/images/profileIcon.png';
  }
}
