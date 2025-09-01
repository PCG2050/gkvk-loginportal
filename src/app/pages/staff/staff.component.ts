import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { UnitsService } from '../../core/services/units.service';
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
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css'
})
export class StaffComponent {
// Dropdown data

private userService = inject(UserService);
private unitService = inject(UnitsService);

  addStaffForm = new FormGroup({
    staffEmail : new FormControl('',[Validators.required, Validators.email]),
  staffFirstName : new FormControl('',[Validators.required, Validators.maxLength(50), Validators.minLength(3)]) ,
  staffLastName : new FormControl('',[Validators.required, Validators.maxLength(50)]),
  staffPassword : new FormControl('',[Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$')]),
  staffPhone: new FormControl('',[Validators.required, Validators.minLength(10), Validators.maxLength(10),Validators.pattern('^[0-9]*$')]),
  staffGender : new FormControl('',[Validators.required]),
  // staffDesignation : new FormControl('',[Validators.required]),
  staffEmploymentType : new FormControl('',[Validators.required]),
  staffDOB : new FormControl('',[Validators.required]),
  staffDOJ : new FormControl('',[Validators.required]),
  staffQualification : new FormControl('',[Validators.required])
  })
  // Staff data
  staffList: Staff[] = [];
  filteredStaff: Staff[] = [];
  staff:any[]=[];

  // Add staff modal state
  showAddStaffModal = false;
  // Edit staff modal state
  showEditStaffModal = false;

  staffData:any[]=[];

  showDeleteConfirm:boolean = false;

  // Filter fields
  filterDesignation = '';
  filterStatus: string = '';

  // Feedback message
  feedbackMessage: string | null = null;

  ngOnInit(): void {
    const user = localStorage.getItem('authtoken');
    console.log(user);
    
    this.getStaff();
  }
  

  // Add new staff
  addStaff() {
    const Id = localStorage.getItem('organizationId');
    const orgId = Number(Id)
    const staffDetails ={
      firstName:this.addStaffForm.controls.staffFirstName.value,
      lastName:this.addStaffForm.controls.staffLastName.value,
      email:this.addStaffForm.controls.staffEmail.value,
      password:this.addStaffForm.controls.staffPassword.value,
      phone:this.addStaffForm.controls.staffPhone.value,
      role:1,
      isDeactivated:true,
      organization:orgId,
      qualification:this.addStaffForm.controls.staffQualification.value,
      dateOfJoining:this.addStaffForm.controls.staffDOJ.value,
      dateOfBirth:this.addStaffForm.controls.staffDOB.value,
      gender:Number(this.addStaffForm.controls.staffGender.value),
      employmentType:Number(this.addStaffForm.controls.staffEmploymentType.value),
    }
    this.userService.addAdmin(orgId, staffDetails).subscribe({
      next:(res:any)=>{
        alert("Successfully added Staff Details")
      },
      error:(err:any)=>{
        alert("Failed to add staff Details")
      },
    })
    console.log(staffDetails);
  }

  getStaff(){
    this.userService.getStaff().subscribe({
      next:(res:any)=>{
        console.log(res);
        this.staff = res;
     this.staff.forEach((staffMember: any) => {
        const locations = staffMember.unitLocationDetails || [];
        const unitId = Number(localStorage.getItem('unitId'));
        const districtId = Number(localStorage.getItem('districtId'))

        staffMember.isMapped = locations.some((loc: any) => 
          loc.unitId === unitId && loc.districtId === districtId
        );
      });
      console.log(this.staff);
      }
    })
  }

  editStaff(staff:any){
        this.showAddStaffModal = true;
        this.addStaffForm.patchValue({
          staffEmail : staff.email,
          staffFirstName: staff.firstName,
          staffLastName : staff.lastName,
          staffPhone :staff.phone,
          staffEmploymentType : staff.employmentType,
          staffQualification :staff.qualification,
          staffGender : staff.gender,
          staffDOB : staff.dob,
          staffDOJ : staff.doj
        })
  }

  confirmDelete(item:any){
    this.showDeleteConfirm = true;
    console.log(item);
    this.staffData = item;
  }

  deleteStaff(){    
    // this.userService.deleteStaff()
  }
  cancelDelete(){
    this.showDeleteConfirm = false;
  }

  mapUnit(staff:any){
    const staffId = staff.userId;
    console.log(staffId);
    
    const mappedData ={
      trainerId : staffId,
      unitId :Number(localStorage.getItem('unitId')),
      districtId : Number(localStorage.getItem('districtId'))
    }

    if(staff.isMapped){
      this.unitService.unMapStaffUnit(mappedData).subscribe({
      next:(res)=>{        
        console.log("Mapped");
      },
      error:(err:any)=>{
        
      }
    })
    }
   else{
     this.unitService.mapStaffUnit(mappedData).subscribe({
      next:(res)=>{        
        console.log("Mapped");
      },
      error:(err:any)=>{

      }
    })
   }
  }

  

  closeEditStaffModal() {
    console.log("close edit");
    this.showAddStaffModal = false;
    this.showEditStaffModal = false;
    // this.setFeedbackMessage('Edit cancelled.', 'info');
  }

  closeAddStaffModal(){
    this.showAddStaffModal = false;    
    // this.setFeedbackMessage('Add staff cancelled.', 'info');
  }

  // Toggle staff status (instant)
  toggleStaffStatus(staff: Staff) {
    staff.active = !staff.active;
  }

  // Filtering
  onSearch() {
    this.filteredStaff = this.staffList.filter(staff =>
      (!this.filterDesignation || staff.designation === this.filterDesignation) &&
      (!this.filterStatus || (this.filterStatus === 'Active' ? staff.active : !staff.active))
    );
  }
setResponseMsg(message: string, isSuccess: boolean) {
    // if (isSuccess) {
    //   this.successMsg = true;
    //   this.successText = message;
    //   this.errorMsg = false;
    // } else {
    //   this.errorMsg = true;
    //   this.errorText = message;
    //   this.successMsg = false;
    // }
    // setTimeout(() => {
    //   this.closeResponse();
    // }, 5000);
  }
}
