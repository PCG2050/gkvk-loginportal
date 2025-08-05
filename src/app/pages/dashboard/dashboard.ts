import { Component } from '@angular/core';
import { InstituteThemeService, Institute } from '../../shared/institute-theme.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [FormsModule, CommonModule],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
 institutes: Institute[] = [];

  // Modal states
  isModalOpen = false;
  isEditMode = false;

   // Feedback message
  feedbackMessage: string = '';
  feedbackMessageType: 'success' | 'error' | 'info' = 'info';

  // Form model
  form: {
    name: string;
    logoUrl?: string;
    communicationChannels: {
      emailEnabled: boolean;
      phoneEnabled: boolean;
    };
    storageInfo: {
      privateContainerName: string;
      publicContainerName: string;
    };
    address: {
      state: string;
      district: string;
      pincode: string;
    };
  } = this.getEmptyForm();

  // Used for editing
  instituteToEdit: Institute | null = null;

  // Delete confirmation
  isDeleteConfirmOpen = false;
  instituteToDelete: Institute | null = null;

  constructor(private instituteService: InstituteThemeService) {}

  ngOnInit(): void {
    this.loadInstitutes();
  }

  private getEmptyForm() {
    return {
      name: '',
      logoUrl: '',
      communicationChannels: {
        emailEnabled: false,
        phoneEnabled: false
      },
      storageInfo: {
        privateContainerName: '',
        publicContainerName: ''
      },
      address: {
        state: '',
        district: '',
        pincode: ''
      }
    };
  }

  // Load from service
  loadInstitutes(): void {
    this.institutes = this.instituteService.getInstitutes();
  }

  openAddModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.instituteToEdit = null;
    this.form = this.getEmptyForm();
  }

  editInstitute(institute: Institute): void {
    this.isModalOpen = true;
    this.isEditMode = true;
    this.instituteToEdit = institute;

    // Pre-fill form
    this.form = {
      name: institute.name,
      logoUrl: institute.logoUrl || '',
      communicationChannels: {
        emailEnabled: institute.communicationChannels?.emailEnabled || false,
        phoneEnabled: institute.communicationChannels?.phoneEnabled || false
      },
      storageInfo: {
        privateContainerName: institute.storageInfo?.privateContainerName || '',
        publicContainerName: institute.storageInfo?.publicContainerName || ''
      },
      address: {
        state: institute.address?.state || '',
        district: institute.address?.district || '',
        pincode: institute.address?.pincode || ''
      }
    };
  }

  saveInstitute(): void {
    if (!this.form.name || !this.form.storageInfo.privateContainerName || !this.form.storageInfo.publicContainerName) {
      alert('Please fill all required fields');
      return;
    }

    if (this.isEditMode && this.instituteToEdit) {
      const updatedInstitute: Partial<Institute> = {
        name: this.form.name,
        logoUrl: this.form.logoUrl,
        communicationChannels: {
          emailEnabled: this.form.communicationChannels.emailEnabled,
          phoneEnabled: this.form.communicationChannels.phoneEnabled
        },
        storageInfo: {
          privateContainerName: this.form.storageInfo.privateContainerName,
          publicContainerName: this.form.storageInfo.publicContainerName
        },
        address: {
          state: this.form.address.state,
          district: this.form.address.district,
          pincode: this.form.address.pincode
        }
      };

      this.instituteService.updateInstitute(this.instituteToEdit.id, updatedInstitute);
    } else {
      const newInstitute: Institute = {
        id: 0, // will be set by service
        name: this.form.name,
        logoUrl: this.form.logoUrl,
        communicationChannels: {
          emailEnabled: this.form.communicationChannels.emailEnabled,
          phoneEnabled: this.form.communicationChannels.phoneEnabled
        },
        storageInfo: {
          privateContainerName: this.form.storageInfo.privateContainerName,
          publicContainerName: this.form.storageInfo.publicContainerName
        },
        address: {
          state: this.form.address.state,
          district: this.form.address.district,
          pincode: this.form.address.pincode
        }
      };

      this.instituteService.addInstitute(newInstitute);
    }

    this.closeModal();
    this.loadInstitutes();
  }
  onLogoSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.form.logoUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }
}

  closeModal(): void {
    this.isModalOpen = false;
    this.instituteToEdit = null;
    this.form = this.getEmptyForm();
  }

  confirmDelete(institute: Institute): void {
    this.isDeleteConfirmOpen = true;
    this.instituteToDelete = institute;
  }

  deleteInstitute(): void {
    if (this.instituteToDelete) {
      this.instituteService.deleteInstitute(this.instituteToDelete.id);
      this.loadInstitutes();
    }
    this.cancelDelete();
  }

  cancelDelete(): void {
    this.isDeleteConfirmOpen = false;
    this.instituteToDelete = null;
  }
}