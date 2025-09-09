import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { UnitsService } from '../../core/services/units.service';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { FilterPipeModule } from 'ngx-filter-pipe';
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
  imports: [FormsModule, CommonModule, ReactiveFormsModule, NgMultiSelectDropDownModule, LoadingSpinnerComponent, FilterPipeModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css'
})
export class StaffComponent {
  // Dropdown data

  private userService = inject(UserService);
  private unitService = inject(UnitsService);

  addStaffForm = new FormGroup({
    staffEmail: new FormControl('', [Validators.required, Validators.email]),
    staffFirstName: new FormControl('', [Validators.required, Validators.maxLength(50), Validators.minLength(3), Validators.pattern('^[a-zA-Z]*$')]),
    staffLastName: new FormControl('', [Validators.required, Validators.maxLength(50), Validators.pattern('^[A-Za-z\s]+$')]),
    staffPassword: new FormControl('', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$')]),
    staffPhone: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(10), Validators.pattern('^[0-9]*$')]),
    staffGender: new FormControl('', [Validators.required]),
    // staffDesignation : new FormControl('',[Validators.required]),
    staffEmploymentType: new FormControl('', [Validators.required]),
    staffDOB: new FormControl('', [Validators.required]),
    staffDOJ: new FormControl('', [Validators.required]),
    staffQualification: new FormControl('', [Validators.required]),
    unitLoc: new FormControl<any[]>([])
  })
  // Staff data
  filteredStaff: Staff[] = [];
  staff: any[] = [];

  // Add staff modal state
  showAddStaffModal = false;
  // Edit staff modal state
  showEditStaffModal = false;
  showPasswordField: boolean = true;

  staffData: any[] = [];
  unitLoc: any[] = [];
  selectedUnitLoc: any[] = [];
  unitLocArray: any[] = [];
  selectedState: any[] = [];
  showDeleteConfirm: boolean = false;
  //response messages
  errorMsg: boolean = false;
  successMsg: boolean = false;
  errorText: string = '';
  successText: string = '';
  trainerId: any;
  dropdownSettings = {};

  formMode: "Create" | "Edit" = "Create";

  isLoading:boolean = false;

  ngOnInit(): void {
    const user = localStorage.getItem('authtoken');
    console.log(user);
    this.getUnitAndLoc();
    this.getStaff();
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'unitlocationId',
      textField: 'unitLocation',
      enableCheckAll: false
    }
  }


  // Add new staff
  addStaff() {
    this.isLoading = true;
    console.log(this.formMode);

    const Id = localStorage.getItem('organizationId');
    const orgId = Number(Id)
    const unitLocIds = this.addStaffForm.get('unitLoc')?.value || [];
    const UnitLocationIds = unitLocIds.map((unit: any) => unit.unitlocationId);
    console.log("loc", UnitLocationIds);
    const staffDetails = {
      firstName: this.addStaffForm.controls.staffFirstName.value,
      lastName: this.addStaffForm.controls.staffLastName.value,
      email: this.addStaffForm.controls.staffEmail.value,
      password: this.addStaffForm.controls.staffPassword.value,
      phone: this.addStaffForm.controls.staffPhone.value,
      role: 1,
      isDeactivated: true,
      organization: orgId,
      qualification: this.addStaffForm.controls.staffQualification.value,
      dateOfJoining: this.addStaffForm.controls.staffDOJ.value,
      dateOfBirth: this.addStaffForm.controls.staffDOB.value,
      gender: Number(this.addStaffForm.controls.staffGender.value),
      employmentType: Number(this.addStaffForm.controls.staffEmploymentType.value),
      organizationUnitLocationIds: UnitLocationIds
    }

    if (this.formMode === "Edit") {
      this.userService.updateStaff(this.trainerId, staffDetails).subscribe({
        next: (res: any) => {
          this.isLoading = false
          this.showAddStaffModal = false;
          this.setResponseMsg("Trainer Updated successfully", true)
        },
        error: (err: any) => {
          this.isLoading = false;
          this.showAddStaffModal = false;
          this.setResponseMsg("failed to update Trainer, Please try again", false)
        }
      })
    }
    if (this.formMode === 'Create') {
      this.userService.addStaff(staffDetails).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.showAddStaffModal = false;
          this.setResponseMsg("Trainer addedd successfully", true)
        },
        error: (err: any) => {
          this.isLoading = false;
          this.showAddStaffModal = false;
          this.setResponseMsg("Failed to add Trainer, Please try again later", false)
        }
      })
    }
  }

  getStaff() {
    this.isLoading = true;
    this.userService.getStaff().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log(res);
        this.staff = res;
        this.staff.forEach((staffMember: any) => {
          const locations = staffMember.unitLocationDetails || [];
          const unitId = Number(localStorage.getItem('unitId'));
          const districtId = Number(localStorage.getItem('districtId'))
          this.setResponseMsg("Fetched sfaff succesfully", true)
          staffMember.isMapped = locations.some((loc: any) =>
            loc.unitId === unitId && loc.districtId === districtId
          );
        });
        console.log(this.staff);
      },
      error:(err:any)=>{
        this.isLoading = false;
        this.setResponseMsg("Failed to get staff",false)
      }
    })
  }
  editStaff(staff: any) {
    this.showPasswordField = false;
    this.showAddStaffModal = true;
    const assignedLocIds: number[] = staff.assignedLocationIds || [];
    const preSelectedUnits = this.unitLocArray.filter(unit =>
      assignedLocIds.includes(unit.unitlocationId)
    );
    console.log(preSelectedUnits);
    this.trainerId = staff.trainerId
    this.formMode = "Edit";
    console.log(this.formMode);
    this.addStaffForm.patchValue({
      staffEmail: staff.email,
      staffFirstName: staff.firstName,
      staffLastName: staff.lastName,
      staffPhone: staff.phone,
      staffEmploymentType: staff.employementType,
      staffQualification: staff.qualification,
      staffGender: staff.gender,
      staffDOB: staff.dateOfBirth,
      staffDOJ: staff.dateOfJoining,
      unitLoc: preSelectedUnits
    })
    this.addStaffForm.get('staffPassword')?.removeValidators;
    const passwordControl = this.addStaffForm.get('staffPassword');
    passwordControl?.clearValidators();
  }

  confirmDelete(item: any) {
    this.trainerId = item.trainerId
    this.showDeleteConfirm = true;
    console.log(item);
    this.staffData = item;
  }
  deleteStaff() {
    this.isLoading = true;
    this.showDeleteConfirm = false;
    this.userService.deleteStaff(this.trainerId).subscribe({
      next: () => {
        this.isLoading = false
        this.setResponseMsg("Trainer deleted successfully", true)
      },
      error: () => {
        this.isLoading = false;
        this.setResponseMsg("Failed to delete trainer, Please try again", false)
      }
    })
  }
  cancelDelete() {
    this.showDeleteConfirm = false;
  }
  toggleStatus(item: any) {
  item.status = !item.status;
}

  mapUnit(staff: any) {
    const staffId = staff.userId;
    console.log(staffId);

    const mappedData = {
      trainerId: staffId,
      unitId: Number(localStorage.getItem('unitId')),
      districtId: Number(localStorage.getItem('districtId'))
    }

    if (staff.isMapped) {
      this.unitService.unMapStaffUnit(mappedData).subscribe({
        next: (res) => {
          console.log("Mapped");
        },
        error: (err: any) => {

        }
      })
    }
    else {
      this.unitService.mapStaffUnit(mappedData).subscribe({
        next: (res) => {
          console.log("Mapped");
        },
        error: (err: any) => {

        }
      })
    }
  }
  // closeEditStaffModal() {
  //   this.showAddStaffModal = false;
  //   // this.showEditStaffModal = false;
  // }

  closeAddStaffModal() {
    this.showAddStaffModal = false;
    // this.setFeedbackMessage('Add staff cancelled.', 'info');
  }

  // Filtering
  onSearch() {
  }
  setResponseMsg(message: string, isSuccess: boolean) {
    if (isSuccess) {
      this.successMsg = true;
      this.successText = message;
      this.errorMsg = false;
    } else {
      this.errorMsg = true;
      this.errorText = message;
      this.successMsg = false;
    }
    setTimeout(() => {
      this.closeResponse();
    }, 3000);
  }
  closeResponse() {
    this.errorMsg = false;
    this.successMsg = false;
  }
  locArray: any[] = [];
  getUnitAndLoc() {
    localStorage.getItem('userId')
    const unitHeadId = Number(localStorage.getItem('userId'));
    console.log(unitHeadId);
    this.unitService.getSpecificUnitHeadUnitLoc(unitHeadId).subscribe({
      next: (res: any) => {
        this.unitLoc = res;
        this.unitLocArray = this.unitLoc.flatMap(unit =>
          unit.locations.map((location: any) => ({
            unitlocationId: location.unitLocationId,
            unitLocation: `${unit.unitName} - ${location.districtName}, ${location.stateName}`
          }))
        );
        console.log(this.unitLocArray);
      }
    })
  }

  OnUnitChange() {
    console.log("changed");
    const unitId = this.addStaffForm.get('unit')?.value;
    console.log(unitId);
    const selectedUnit = this.unitLoc.find(u => u.unitId == unitId);
    console.log(selectedUnit);
    //  localStorage.setItem('unitId', unitId.);
    this.selectedUnitLoc = selectedUnit.locations;
    console.log(this.selectedUnitLoc);
    if (selectedUnit && selectedUnit.locations) {
      const uniqueStates = selectedUnit.locations.filter(
        (loc: any, index: any, self: any) =>
          index === self.findIndex(
            (l: any) => l.stateName === loc.stateName && l.stateId === loc.stateId
          )
      );
      console.log(uniqueStates);
      this.selectedState = uniqueStates;
      console.log('Unique states:', this.selectedUnitLoc);
    } else {
      this.selectedUnitLoc = [];
    }
  }
  onStateChange() {
    const stateId = this.addStaffForm.get('state')?.value;
  }
  onDistrictChange() {
    const stateId = Number(this.addStaffForm.get('state')?.value);
    // localStorage.setItem('stateId',stateId.toString());
    const districtId = Number(this.addStaffForm.get('district')?.value);
    localStorage.setItem('districtId', districtId.toString());
    const selectedUnit = this.selectedUnitLoc.find(unit =>
      unit.stateId === stateId && unit.districtId === districtId)

    console.log(selectedUnit);
    if (selectedUnit) {
      const unitLocId = selectedUnit.unitLocationId
      console.log(unitLocId);
    }
    else {
      console.log('Cannot find specific unit');
    }
  }
  onItemSelect(item: any) {
    console.log(item);
  }
  onSelectAll(items: any) {
    console.log(items);
  }
  openAddStaffModal() {
  this.addStaffForm.reset({
    staffEmail: '',
    staffFirstName: '',
    staffLastName: '',
    staffPassword: '',
    staffPhone: '',
    staffGender: '', // Select Gender by default
    staffEmploymentType: '', // Select Employment Type by default
    staffDOB: '',
    staffDOJ: '',
    staffQualification: '',
    unitLoc: []
  });

  this.showPasswordField = true;
  this.formMode = "Create";
  this.showAddStaffModal = true;

  // Reset password validators in case they were removed during edit
  const passwordControl = this.addStaffForm.get('staffPassword');
  passwordControl?.setValidators([
    Validators.required,
    Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$')
  ]);
  passwordControl?.updateValueAndValidity();
}

itemFilter : any ={
  email : ''
}

}
