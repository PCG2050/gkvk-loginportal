import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
export interface Staff {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  gender: string;
  designation: string;
  employmentType: string;
  dob: string;
  doj: string;
  qualification: string;
  active: boolean;
}
@Component({
  selector: 'app-staff',
  imports: [FormsModule, CommonModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css'
})
export class StaffComponent {
// Dropdown data
  genders = ['Male', 'Female', 'Other'];
  employmentTypes = ['Permanent', 'Temporary'];
  units = [
    'Farmer Training Institute',
    'Staff Training Institute',
    'Farmer Information Unit',
    'Institute of Baking Technology and Value Addition',
    'Agricultural Technology Information Centre',
    'Distance Education Unit',
    'Agricultural Sciences Museum',
    'National Agricultural Extension Project',
    'Extension Education Units',
    'Krishi Vigyan Kendras'
  ];

  // Staff data
  staffList: Staff[] = [];
  filteredStaff: Staff[] = [];

  // Add staff modal state and fields
  showAddStaffModal = false;
  staffEmail = '';
  staffFirstName = '';
  staffLastName = '';
  staffPassword = '';
  staffGender = '';
  staffDesignation = '';
  staffEmploymentType = '';
  staffDOB = '';
  staffDOJ = '';
  staffQualification = '';

  // Edit staff modal state and fields
  showEditStaffModal = false;
  editStaffData: Staff = this.getEmptyStaff();

  // Filter fields
  filterDesignation = '';
  filterStatus: string = '';

  // Feedback message
  feedbackMessage: string | null = null;

  ngOnInit(): void {
    // Example data
    this.staffList = [
      {
        email: 'staff1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: '',
        gender: 'Male',
        designation: 'Manager',
        employmentType: 'Permanent',
        dob: '1990-01-01',
        doj: '2020-01-01',
        qualification: 'MSc',
        active: true
      },
      {
        email: 'staff2@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: '',
        gender: 'Female',
        designation: 'Assistant',
        employmentType: 'Temporary',
        dob: '1992-05-10',
        doj: '2021-06-15',
        qualification: 'BSc',
        active: false
      }
    ];
    this.filteredStaff = [...this.staffList];
  }

  // Add new staff
  addStaff() {
    if (
      this.staffEmail &&
      this.staffFirstName &&
      this.staffLastName &&
      this.staffPassword &&
      this.staffGender &&
      this.staffDesignation &&
      this.staffEmploymentType &&
      this.staffDOB &&
      this.staffDOJ &&
      this.staffQualification
    ) {
      if (this.staffList.some(s => s.email.toLowerCase() === this.staffEmail.toLowerCase())) {
        this.setFeedbackMessage('Staff with this email already exists.', 'error');
        return;
      }
      this.staffList.push({
        email: this.staffEmail,
        firstName: this.staffFirstName,
        lastName: this.staffLastName,
        password: this.staffPassword,
        gender: this.staffGender,
        designation: this.staffDesignation,
        employmentType: this.staffEmploymentType,
        dob: this.staffDOB,
        doj: this.staffDOJ,
        qualification: this.staffQualification,
        active: true
      });
      this.onSearch();
      this.resetAddStaffForm();
      this.showAddStaffModal = false;
      this.setFeedbackMessage('Staff added successfully!', 'success');
    } else {
      this.setFeedbackMessage('Please fill all fields.', 'error');
    }
  }

    // Search by email
  searchEmail: string = '';
  // Search by email handler
  onSearchByEmail() {
    const email = this.searchEmail.trim().toLowerCase();
    if (email) {
      this.filteredStaff = this.staffList.filter(staff => staff.email.toLowerCase().includes(email));
      this.setFeedbackMessage(`Found ${this.filteredStaff.length} staff.`, 'info');
    } else {
      this.filteredStaff = [...this.staffList];
    }
  };

  // Edit staff
  editStaff(staff: Staff) {
    this.editStaffData = { ...staff };
    this.showEditStaffModal = true;
  }

  saveEditedStaff() {
    const idx = this.staffList.findIndex(s => s.email === this.editStaffData.email);
    if (idx !== -1) {
      this.staffList[idx] = { ...this.editStaffData };
      this.onSearch();
      this.showEditStaffModal = false;
      this.setFeedbackMessage('Staff details updated.', 'success');
    }
  }

  closeEditStaffModal() {
    this.showEditStaffModal = false;
    this.editStaffData = this.getEmptyStaff();
    this.setFeedbackMessage('Edit cancelled.', 'info');

  }
  closeAddStaffModal(){
    this.showAddStaffModal = false;    
    this.setFeedbackMessage('Add staff cancelled.', 'info');
  }

  // Toggle staff status (instant)
  toggleStaffStatus(staff: Staff) {
    staff.active = !staff.active;
    this.setFeedbackMessage(`Staff status changed to ${staff.active ? 'Active' : 'Deactive'}.`, 'info');
    // If using a service, update there as well
  }

  // Filtering
  onSearch() {
    this.filteredStaff = this.staffList.filter(staff =>
      (!this.filterDesignation || staff.designation === this.filterDesignation) &&
      (!this.filterStatus || (this.filterStatus === 'Active' ? staff.active : !staff.active))
    );
    this.setFeedbackMessage(`Found ${this.filteredStaff.length} staff.`, 'info');
  }

  onReset() {
    this.filterDesignation = '';
    this.filterStatus = '';
    this.filteredStaff = [...this.staffList];
    this.setFeedbackMessage('Filters reset. Showing all staff.', 'info');
  }

  // Helpers
  resetAddStaffForm() {
    this.staffEmail = '';
    this.staffFirstName = '';
    this.staffLastName = '';
    this.staffPassword = '';
    this.staffGender = '';
    this.staffDesignation = '';
    this.staffEmploymentType = '';
    this.staffDOB = '';
    this.staffDOJ = '';
    this.staffQualification = '';
  }

  getEmptyStaff(): Staff {
    return {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      gender: '',
      designation: '',
      employmentType: '',
      dob: '',
      doj: '',
      qualification: '',
      active: true
    };
  }

  setFeedbackMessage(message: string, type: 'success' | 'error' | 'info') {
    this.feedbackMessage = message;
    setTimeout(() => {
      this.feedbackMessage = null;
    }, 5000);
  }
}
