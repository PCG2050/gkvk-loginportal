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

// Define a type for Trainer Assignment for better type safety
interface TrainerAssignment {
  email: string;
  assignments: { unit: string; state: string; district: string }[];
}
@Component({
  selector: 'app-edit-trainers',
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './edit-trainers.component.html',
  styleUrl: './edit-trainers.component.css'
})
export class EditTrainersComponent {
// Data for dropdowns
  units = ['Farmer Training Institute'
,'Staff Training Institute'
,'Farmer Information Unit'
,'Institute of Baking Technology and Value Addition'
,'Agricultural Technology Information Centre'
,'Distance Education Unit'
,'Agricultural Sciences Museum'
,'National Agricultural Extension Project'
,'Extension Education Units'
,'Krishi Vigyan Kendras'];
  // states = ['Karnataka', 'Maharashtra', 'Tamil Nadu'];
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
  private userService = inject(AdminService);

  unitsList$! :Observable<Units[]>;
  states$! : Observable<State[]>;
  districts$! : Observable<Districts[]>;
  selectedStateId: any;

  unitHeadForm =new FormGroup({
    unitHeadEmail : new FormControl('',[Validators.required]),
    unitHeadFirstName : new FormControl('',[]),
    unitHeadLastName : new FormControl('',[Validators.required]),
    unit : new FormControl('',[Validators.required]),
    unitHeadPassword : new FormControl('',[Validators.required]),
    unitState : new FormControl('', [Validators.required]),
    unitDistrict :new FormControl('', [Validators.required]),
    unitHeadPhone : new FormControl('', [Validators.required])
  })
  filterForm = new FormGroup({
  unit: new FormControl(''),
  state: new FormControl(''),
  district: new FormControl('')
});
editAddAssignmentsForm = new FormGroup({
  manageUnit : new FormControl('', [Validators.required]),
  manageState : new FormControl('', [Validators.required]),
  manageDistrict : new FormControl('', [Validators.required])
})

  ngOnInit(): void {
    // Initialize with some dummy data
    this.trainerAssignments = [
      {
        email: 'trainer1@example.com',
        assignments: [
          { unit: 'Agricultural Sciences Museum', state: 'Karnataka', district: 'Bangalore' },
          { unit: 'National Agricultural Extension Project', state: 'Karnataka', district: 'Mysore' }
        ]
      },
      {
        email: 'trainer2@example.com',
        assignments: [
          { unit: 'Extension Education Units', state: 'Karnataka', district: 'Mysore' }
        ]
      },
      {
        email: 'trainer3@example.com',
        assignments: [
          { unit: 'Farmer Information Unit', state: 'Karnataka', district: 'Bangalore' },
          { unit: 'Krishi Vigyan Kendras', state: 'Karnataka', district: 'Tumkur' }
        ]
      }
    ];
    this.filteredAssignments = [...this.trainerAssignments];
    this.onLoadUnits();
    this.onLoadStates();
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
  closeAddTrainerModal(){
    this.showAddTrainerModal = false;
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
  startManageAssignment(trainer: TrainerAssignment, assignmentIndex: number) {
    this.showManageAssignment = true;
    this.manageTrainer = trainer;
    this.manageAssignmentIndex = assignmentIndex;
    const assignment = trainer.assignments[assignmentIndex];
    this.manageUnit = assignment.unit;
    this.manageState = assignment.state;
    this.manageDistrict = assignment.district;
  }

  // Saves the managed assignment
  saveManagedAssignment() {
    if (
      this.manageTrainer &&
      this.manageAssignmentIndex !== null &&
      this.manageUnit &&
      this.manageState &&
      this.manageDistrict
    ) {
      this.manageTrainer.assignments[this.manageAssignmentIndex] = {
        unit: this.manageUnit,
        state: this.manageState,
        district: this.manageDistrict
      };
      this.setFeedbackMessage('Assignment updated.', 'success');
      this.onSearch();
    }
    this.cancelManageAssignment();
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
  confirmDelete(trainer: TrainerAssignment, assignmentIndex: number) {
    this.trainerToDelete = trainer;
    this.assignmentToDeleteIndex = assignmentIndex;
    this.showDeleteConfirm = true;
  }

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
   this.unitsList$= this.unitService.getUnits()
  }
  onLoadStates(){
    this.states$ = this.locationService.getStates()
  }
  onStateChange(event:Event){
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
  addUnitHead(){
    const organizationId = Number(localStorage.getItem('organizationId'));
    const userDate = {
      id: 1,
    firstName:this.unitHeadForm.controls.unitHeadFirstName.value ||'',
    lastName: this.unitHeadForm.controls.unitHeadLastName.value,
    email: this.unitHeadForm.controls.unitHeadEmail.value,
    role: 2,
    phone: this.unitHeadForm.controls.unitHeadPhone.value,
    organizationId: organizationId,
    isDeactivated: true
    }
  this.userService.addAdmin(organizationId, userDate).subscribe(res=>{
    console.log(res);
    
  })
  }
 
}
