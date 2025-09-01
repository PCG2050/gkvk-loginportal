import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UnitsService } from '../../core/services/units.service';
import { Units } from '../../core/models/units.model';
import { catchError, Observable, of, tap } from 'rxjs';
import { LocationsService } from '../../core/services/locations.service';
import { State } from '../../core/models/states.model';
import { Districts } from '../../core/models/districts.models';
import { AdminService } from '../../core/services/admin.service';
import { NgMultiSelectDropDownModule, IDropdownSettings } from 'ng-multiselect-dropdown';
import { UserService } from '../../core/services/user.service';
import { NgxPaginationModule } from 'ngx-pagination';

// Define a type for Trainer Assignment for better type safety
interface TrainerAssignment {
  email: string;
  assignments: { unit: string; state: string; district: string }[];
}
@Component({
  selector: 'app-edit-trainers',
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, NgMultiSelectDropDownModule, NgxPaginationModule],
  templateUrl: './edit-trainers.component.html',
  styleUrl: './edit-trainers.component.css',
})
export class EditTrainersComponent {
  // Data for dropdowns
  //   units = ['Farmer Training Institute'
  // ,'Staff Training Institute'
  // ,'Farmer Information Unit'
  // ,'Institute of Baking Technology and Value Addition'
  // ,'Agricultural Technology Information Centre'
  // ,'Distance Education Unit'
  // ,'Agricultural Sciences Museum'
  // ,'National Agricultural Extension Project'
  // ,'Extension Education Units'
  // ,'Krishi Vigyan Kendras'];
  //   // states = ['Karnataka', 'Maharashtra', 'Tamil Nadu'];
  // districtsByState: { [state: string]: string[] } = {
  //   'Karnataka': ['Bangalore', 'Mysore', 'Tumkur'],
  //   'Maharashtra': ['Pune', 'Mumbai', 'Nagpur'],
  //   'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai']
  // };

  showAddTrainerModal = false;
  // Form fields for adding a new trainer assignment
  newTrainerEmail = '';
  newAssignmentUnit = '';
  newAssignmentState = '';
  newAssignmentDistrict = '';
  newTrainerFirstName = '';
  newTrainerLastName = '';
  newTrainerPhone = '';
  newTrainerPassword = '';

  // Filter selections
  selectedUnit = '';
  selectedState = '';
  selectedDistrict = '';

  // Data for trainer assignments
  trainerAssignments: TrainerAssignment[] = [];
  filteredAssignments: TrainerAssignment[] = [];

  // Assignment management state
  showManageAssignment = false;
  manageTrainer: TrainerAssignment | null = null;
  manageAssignmentIndex: number | null = null;
  manageUnit = '';
  manageState = '';
  manageDistrict = '';

  // Delete confirmation modal state
  showDeleteConfirm = false;
  trainerToDelete: TrainerAssignment | null = null;
  assignmentToDeleteIndex: number | null = null;

  // Feedback message for user actions
  feedbackMessage: string | null = null;

  private unitService = inject(UnitsService);
  private locationService = inject(LocationsService);
  private userService = inject(UserService);
  // private user = inject(UserService);
  unitsList$!: Observable<Units[]>;
  states$!: Observable<State[]>;
  districts$!: Observable<Districts[]>;
  selectedStateId: any;
  unitHeads: any[] = [];
  selectedUnitHeadId: any;
  openOrgUnitDropDown: boolean = false;

  //orgUnits to map unit head
  orgUnits: any[] = [];
  orgUnitsArray: any[] = [];
  dropDownSettings!: IDropdownSettings;
  selectedOrgUnits: { [userId: number]: any[] } = {};
  selectedOrgIds: any[] = [];
  selectedUnitId: any;
  selectedDistrictId: any[] = [];
  unitHeadId: any;

  unitLocationMap: any = {};

  //response message
  successMsg: boolean = true;
  errorMsg: boolean = false;
  errorText: string = '';
  successText: string = '';

  //pagination
  p: number = 1;
  total: number = 0;

  //to hide password field in edit form 
  hidePasswordField: boolean = true;
  formMode: 'Create' | 'Edit' = 'Create'
  unitHeadForm = new FormGroup({
    unitHeadEmail: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(50)]),
    unitHeadFirstName: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z]*$'), Validators.maxLength(50), Validators.minLength(3)]),
    unitHeadLastName: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z]*$'), Validators.maxLength(50)]),
    unitHeadPhone: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$'), Validators.minLength(10), Validators.maxLength(10)]),

    // unit : new FormControl('',[Validators.required]),
    unitHeadPassword: new FormControl('', this.formMode === 'Create' ? [Validators.required, Validators.minLength(8), Validators.maxLength(16), Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$')] : []),
    orgUnit: new FormControl<any[]>([])    // unitState : new FormControl('', [Validators.required]),
    // unitDistrict :new FormControl('', [Validators.required]),
  })
  filterForm = new FormGroup({
    unit: new FormControl(''),
    state: new FormControl(''),
    district: new FormControl('')
  });
  editUnitHead(unitHead: any) {
    this.unitHeadId = unitHead.userId
    this.hidePasswordField = false;
    this.formMode = 'Edit';
    this.selectedUnitHeadId = unitHead.userId;
    this.showAddTrainerModal = true;
    this.unitHeadForm.get('unitHeadPassword')?.clearValidators();
    this.onLoadOrgUnits().subscribe(() => {
      const assignedLocations = Array.isArray(unitHead.unitLocationDetails)
        ? unitHead.unitLocationDetails
        : [];
      console.log('assignedLocations', assignedLocations);

      const preSelectedUnits = this.orgUnits.filter(orgUnit =>
        assignedLocations.some(
          (details: any) => details.unitLocationId === orgUnit.orgUnitLocationId
        )
      );

      console.log("Pre-selected units:", preSelectedUnits);
      this.unitHeadForm.patchValue({
        unitHeadEmail: unitHead.email,
        unitHeadFirstName: unitHead.firstName,
        unitHeadLastName: unitHead.lastName,
        unitHeadPhone: unitHead.phone,
        orgUnit: preSelectedUnits
      });
    });



  }

  editAddAssignmentsForm = new FormGroup({
    manageUnit: new FormControl('', [Validators.required]),
    manageState: new FormControl('', [Validators.required]),
    manageDistrict: new FormControl('', [Validators.required])
  })

  ngOnInit(): void {
    this.dropDownSettings = {
      singleSelection: false,
      idField: 'orgUnitLocationId',
      textField: 'unitLoc',
      selectAllText: 'Map All Unit',
      unSelectAllText: 'Unmap Unit',
    };
    this.setResponseMsg("Unit Head updated successfully.", true);

    this.onLoadUnits();
    this.onLoadStates();
    this.onLoadOrgUnits();
    this.getUnitHead();
    this.unitHeads.forEach((unitHead) => {
      if (!this.selectedOrgUnits[unitHead.userId]) {
        this.selectedOrgUnits[unitHead.userId] = []; // or pre-fill based on your data
      }
    });


  }
  openAddUnitHeadForm() {
    this.formMode = 'Create';
    this.hidePasswordField = true; // Show password field for a new user
    this.unitHeadForm.reset();

    this.unitHeadForm.get('unitHeadPassword')?.setValidators([
    ]);
    this.unitHeadForm.get('unitHeadPassword')?.updateValueAndValidity();

    this.onLoadOrgUnits().subscribe({
      next: (data) => {
        this.showAddTrainerModal = true;
      },
      error: (err) => {
        console.error('Error loading organizational units:', err);
        this.showAddTrainerModal = true;
      }
    });
  }
  // Adds a new trainer assignment
  addTrainer() {
    if (
      this.newTrainerEmail &&
      this.newTrainerFirstName &&
      this.newTrainerLastName &&
      this.newTrainerPassword &&
      this.newTrainerPhone &&
      this.newAssignmentUnit &&
      this.newAssignmentState &&
      this.newAssignmentDistrict
    ) {
      let trainer = this.trainerAssignments.find(t => t.email.toLowerCase() === this.newTrainerEmail.toLowerCase());
      if (!trainer) {
        trainer = {
          email: this.newTrainerEmail,
          assignments: []
        };
        this.trainerAssignments.push(trainer);
      }
      trainer.assignments.push({
        unit: this.newAssignmentUnit,
        state: this.newAssignmentState,
        district: this.newAssignmentDistrict
      });
      this.onSearch();
      // Reset all fields
      this.newTrainerEmail = '';
      this.newTrainerFirstName = '';
      this.newTrainerLastName = '';
      this.newTrainerPassword = '';
      this.newTrainerPhone = '';
      this.newAssignmentUnit = '';
      this.newAssignmentState = '';
      this.newAssignmentDistrict = '';
      this.showAddTrainerModal = false;
      this.setFeedbackMessage('Trainer assignment added!', 'success');
    } else {
      this.setFeedbackMessage('Please fill all fields.', 'error');
    }
  }
  closeAddTrainerModal() {
    this.showAddTrainerModal = false;
    this.unitHeadForm.reset();
    this.selectedOrgIds = [];
  }

  // Filters the trainer assignments based on selected criteria
  onSearch() {
    this.filteredAssignments = this.trainerAssignments.filter(trainer =>
      trainer.assignments.some(a =>
        (!this.selectedUnit || a.unit === this.selectedUnit) &&
        (!this.selectedState || a.state === this.selectedState) &&
        (!this.selectedDistrict || a.district === this.selectedDistrict)
      )
    );
    this.setFeedbackMessage(`Found ${this.filteredAssignments.length} trainers.`, 'info');
  }

  // Resets all filter selections and displays all assignments
  onReset() {
    this.selectedUnit = '';
    this.selectedState = '';
    this.selectedDistrict = '';
    this.filteredAssignments = [...this.trainerAssignments];
    this.setFeedbackMessage('Filters reset. Showing all assignments.', 'info');
  }

  // Opens the manage assignment modal for a trainer's assignment
  startManageAssignment() {
    this.showManageAssignment = true;
    // this.manageTrainer = trainer;
    // this.manageAssignmentIndex = assignmentIndex;
    // const assignment = trainer.assignments[assignmentIndex];
    // this.manageUnit = assignment.unit;
    // this.manageState = assignment.state;
    // this.manageDistrict = assignment.district;
  }

  // Saves the managed assignment
  saveManagedAssignment() {

  }

  // Cancels the manage assignment modal
  cancelManageAssignment() {
    this.showManageAssignment = false;
    this.manageTrainer = null;
    this.manageAssignmentIndex = null;
    this.manageUnit = '';
    this.manageState = '';
    this.manageDistrict = '';
  }

  // Sets the trainer and assignment to be deleted and opens the confirmation modal


  // Deletes the confirmed assignment from the trainer
  deleteAssignment() {
    if (
      this.trainerToDelete &&
      this.assignmentToDeleteIndex !== null
    ) {
      this.trainerToDelete.assignments.splice(this.assignmentToDeleteIndex, 1);
      if (this.trainerToDelete.assignments.length === 0) {
        // Remove trainer if no assignments left
        this.trainerAssignments = this.trainerAssignments.filter(
          t => t !== this.trainerToDelete
        );
      }
      this.onSearch();
      this.setFeedbackMessage('Assignment deleted successfully.', 'success');
    }
    this.showDeleteConfirm = false;
    this.trainerToDelete = null;
    this.assignmentToDeleteIndex = null;
  }

  // Cancels the delete operation
  cancelDelete() {
    this.showDeleteConfirm = false;
    this.trainerToDelete = null;
    this.assignmentToDeleteIndex = null;
    this.setFeedbackMessage('Delete operation cancelled.', 'info');
  }

  // Update district dropdown when state changes in add form
  onNewAssignmentStateChange() {
    this.newAssignmentDistrict = '';
  }

  // Update district dropdown when state changes in manage modal
  onManageAssignmentStateChange() {
    this.manageDistrict = '';
  }

  // Placeholder for download report logic
  downloadReport() {
    this.setFeedbackMessage('Download Report clicked! (Implementation pending)', 'info');
    // In a real application, you would generate a CSV or PDF here
  }

  // Helper to display feedback messages
  setFeedbackMessage(message: string, type: 'success' | 'error' | 'info') {
    this.feedbackMessage = message;
    setTimeout(() => {
      this.feedbackMessage = null;
    }, 5000);
  }
  onLoadUnits() {
    this.unitsList$ = this.unitService.getUnits().pipe(
      tap(unitsList => console.log('Units:', unitsList)),
      catchError(err => {
        console.error('Error loading units:', err);
        return of([]); // fallback ensures dropdown gets rendered
      })
    );
  }
  onLoadStates() {
    this.states$ = this.locationService.getStates()
  }
  onStateChange(event: Event) {
    const stateId = Number((event.target as HTMLSelectElement).value);
    this.selectedStateId = stateId;
    console.log(
      this.selectedStateId
    );

    if (stateId) {
      this.districts$ = this.locationService.getDistricts(this.selectedStateId).pipe(
        tap(districts => console.log('Districts:', districts)),
        catchError(err => {
          console.error('Error fetching districts:', err);
          return of([]);
        })
      );
    } else {
      this.districts$ = of([]);
    }
  }
  addOrEditUnitHead() {
     setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, 300);
    const organizationId = Number(localStorage.getItem('organizationId'));

  // ✅ Always get selected orgUnit values from form
  const selectedOrgUnitsFromForm = this.unitHeadForm.get('orgUnit')?.value || [];

  // ✅ Extract just the IDs
  const organizationUnitLocationIds = selectedOrgUnitsFromForm.map((unit: any) => unit.orgUnitLocationId);
    if (this.formMode === 'Create') {
      const userData = {
        id: 1,
        FirstName: this.unitHeadForm.controls.unitHeadFirstName.value || '',
        LastName: this.unitHeadForm.controls.unitHeadLastName.value,
        email: this.unitHeadForm.controls.unitHeadEmail.value,
        role: 2,
        phone: this.unitHeadForm.controls.unitHeadPhone.value,
        organizationId: organizationId,
        password: this.unitHeadForm.controls.unitHeadPassword.value,
        isDeactivated: true,
        organizationUnitLocationIds: organizationUnitLocationIds
      }
      this.userService.addUnitHead(organizationId, userData).subscribe({
        next: (res: any) => {
          this.showAddTrainerModal = false;
          setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, 300); 
          this.setResponseMsg("Added Unit Head successfully.", true);
          this.unitHeadForm.reset();
          this.getUnitHead()
        },
        error: (err: any) => {
          console.error(err);
          this.setResponseMsg("Failed to add Unit Head. Please try again.", false);
        },
      })
    }
    if (this.formMode === 'Edit') {
      const organizationId = Number(localStorage.getItem('organizationId'));
      this.showAddTrainerModal = true;
      const userData = {
        id: 1,
        FirstName: this.unitHeadForm.controls.unitHeadFirstName.value || '',
        LastName: this.unitHeadForm.controls.unitHeadLastName.value,
        email: this.unitHeadForm.controls.unitHeadEmail.value,
        role: 2,
        phone: this.unitHeadForm.controls.unitHeadPhone.value,
        organizationId: organizationId,
        isDeactivated: true,
        organizationUnitLocationIds: organizationUnitLocationIds,
        // orgUnit : 
      }
      this.userService.updateUnitHead(this.unitHeadId, userData).subscribe({
        next: (res: any) => {
          this.showAddTrainerModal = false;
          
          this.setResponseMsg("Unit Head updated successfully.", true);
          this.unitHeadForm.reset();
          this.getUnitHead();
        },
        error: (err: any) => {
          console.error(err);
          this.setResponseMsg("Failed to update Unit Head. Please try again.", false);
        }
      })
    }
    this.unitHeadForm.reset();

  }

  onLoadOrgUnits(): Observable<any[]> {
    return this.unitService.getOrganizationUnit().pipe(
      tap((units: any[]) => {
        this.orgUnits = units.map(unit => ({
          ...unit,
          orgUnitLocationId: unit.orgUnitLocationId,
          unitLoc: `${unit.unitName} - ${unit.districtName}, ${unit.stateName}`
        }));

        this.orgUnitsArray = Object.values(this.orgUnits);
        console.log("Mapped Org Units:", this.orgUnits);
      }),
      catchError(err => {
        console.error('Error loading org units:', err);
        this.orgUnits = [];
        return of([]);
      })
    );
  }

  getUnitHead() {
    this.userService.getUnitHead().subscribe({
      next: (res: any) => {
        console.log(res);

        if (res && Array.isArray(res)) {
          this.unitHeads = res;

          // Ensure each unitHead's location details is an array for template safety
          this.unitHeads.forEach(unitHead => {
            if (!Array.isArray(unitHead.unitLocationDetails)) {
              // If the API sends a single object, wrap it in an array for consistency
              unitHead.unitLocationDetails = unitHead.unitLocationDetails ? [unitHead.unitLocationDetails] : [];
            }
          });

        } else {
          this.unitHeads = [];
          console.error('API response is not in the expected format.');
        }
      },
      error: (err) => {
        console.error('Error fetching unit heads:', err);
        this.unitHeads = []; // Always ensure the array is initialized
      }
    });
  }

  deleteUnitHead() {
    this.userService.deleteUnitHead(this.unitHeadId).subscribe({
      next: () => {
        // this.successMsg = true;
        //  this.successText = "Deleted Unit Head Successfully"
        this.setResponseMsg("Deleted Unit Head successfully.", true);
        this.unitHeadForm.reset();
        this.getUnitHead()
      },
      error: () => {
        this.setResponseMsg("Failed to Delete Unit Head. Please try again.", false);
      }
    })
  }

  mapOrgUnit(userId: number) {
    const unitHeadId = userId;
    console.log(unitHeadId);
    this.selectedUnitHeadId = unitHeadId

    this.onLoadOrgUnits();
    this.openOrgUnitDropDown = true;
  }

  confirmDelete(unitHead: any) {
    this.showDeleteConfirm = true;
    this.unitHeadId = unitHead.userId;
    console.log(this.unitHeadId);
  }
  closeOrgUnitDropDown() {
    this.openOrgUnitDropDown = false
  }
  onItemSelect(item: any) {
    const id = item.orgUnitLocationId;
    this.selectedOrgIds.push(id);
    console.log('Selected OrgUnitLocationIds:', this.selectedOrgIds);
    console.log(this.selectedOrgIds);
  }

  onItemDeSelect(item: any) {
    const id = item.orgUnitLocationId;
    this.selectedOrgIds.push(id);
    console.log('Deselected item:', item);
    console.log('Current selected items:', this.selectedOrgUnits);
  }

  onSelectAll(items: any) {
    console.log('All items selected:', items);
    this.selectedOrgUnits = items;
    const selectedIds: number[] = Object.values(this.selectedOrgUnits)
      .flat()
      .map((unit: any) => unit.orgUnitLocationId);
    this.selectedOrgIds = selectedIds;
    console.log(this.selectedOrgIds);
  }

  onDeSelectAll(items: any) {
    console.log('All items deselected');
    this.selectedOrgUnits = [];
    this.selectedOrgIds = [];
  }


  onPageChange(event: number) {
    this.p = event;
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
}
