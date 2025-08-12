import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { State } from '../../core/models/states.model';
import { catchError, Observable, of, tap } from 'rxjs';
import { LocationsService } from '../../core/services/locations.service';
import { Districts } from '../../core/models/districts.models';
import { UnitsService } from '../../core/services/units.service';
import { Units } from '../../core/models/units.model';
interface Unit{
  name: string;
  state:string;
  district:string;
}
@Component({
  selector: 'app-edit-units',
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule],
  templateUrl: './edit-units.component.html',
  styleUrl: './edit-units.component.css'
})
export class EditUnitsComponent implements OnInit{
// Data for dropdowns
  //  states = ['Karnataka', 'Maharashtra', 'Tamil Nadu'];
  // districtsByState: { [state: string]: string[] } = {
  //   'Karnataka': ['Bangalore', 'Mysore', 'Tumkur'],
  //   'Maharashtra': ['Pune', 'Mumbai', 'Nagpur'],
  //   'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai']
  // };
  states$! : Observable<State[]>
  districts$! : Observable<Districts[]>
  selectedStateId: number|undefined;
  units$!:Observable<Units[]>;
  unitLocations$!:Observable<any[]>;

  // Form fields for adding a new unit
   newUnitName = '';
  newUnitState = '';
  newUnitDistrict = '';

  // Filter selection
  selectedState = '';
  selectedDistrict = '';

  // Data for units
  unit: Unit[] = [];
  filteredUnits: Unit[] = [];

  // Delete confirmation modal state
  showDeleteConfirm = false;
  unitToDelete: Unit | null = null;

  // Feedback message for user actions
  feedbackMessage: string | null = null;
  editUnitModal:boolean = false;

  private service = inject(LocationsService);
  private unitService = inject(UnitsService);

   // List of predefined unit names
   unitNames: string[] = [
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

  unitOrganizationForm =new FormGroup({
    newUnitName : new FormControl('',[Validators.required]),
    newUnitState : new FormControl('', [Validators.required]),
    newUnitDistrict : new FormControl('',[Validators.required])
  })
   editUnitForm = new FormGroup({
    unitId: new FormControl('', Validators.required),
    stateId: new FormControl('', Validators.required),
    districtId: new FormControl('', Validators.required)
  });
   ngOnInit(): void {
    // Initialize with some dummy data for units
    this.unit = [
      { name: 'Farmer Training Institute', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Staff Training Institute', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Farmer Information Unit', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Institute of Baking Technology and Value Addition', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Agricultural Technology Information Centre', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Distance Education Unit', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Agricultural Sciences Museum', state: 'Karnataka', district: 'Bangalore' },
      { name: 'National Agricultural Extension Project', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Extension Education Units', state: 'Karnataka', district: 'Bangalore' },
      { name: 'Krishi Vigyan Kendras', state: 'Karnataka', district: 'Bangalore' },

    ];
    this.filteredUnits = [...this.unit];
    this.onLoadStates();
    this.getUnits();
    this.getUnitOrganization();
  }


  // Adds a new unit to the list
  addUnit() {
    if (
      this.newUnitName &&
      this.newUnitState &&
      this.newUnitDistrict &&
      !this.unit.some(u =>
        u.name.toLowerCase() === this.newUnitName.toLowerCase() &&
        u.state === this.newUnitState &&
        u.district === this.newUnitDistrict
      )
    ) {
      const newUnit: Unit = {
        name: this.newUnitName,
        state: this.newUnitState,
        district: this.newUnitDistrict
      };
      this.unit.push(newUnit);
      this.onSearch();
      this.newUnitName = '';
      this.newUnitState = '';
      this.newUnitDistrict = '';
      this.setFeedbackMessage('Unit added successfully!', 'success');
    } else {
      let message = 'Invalid input. Please ensure unit name, state, and district are filled correctly.';
      if (
        this.newUnitName && this.newUnitState && this.newUnitDistrict &&
        this.unit.some(u =>
          u.name.toLowerCase() === this.newUnitName.toLowerCase() &&
          u.state === this.newUnitState &&
          u.district === this.newUnitDistrict
        )
      ) {
        message = `Unit '${this.newUnitName}' in '${this.newUnitDistrict}, ${this.newUnitState}' already exists.`;
      }
      this.setFeedbackMessage(message, 'error');
    }
  }

  // Filters the units based on selected state and district
  onSearch() {
    this.filteredUnits = this.unit.filter(unit =>
      (!this.selectedState || unit.state === this.selectedState) &&
      (!this.selectedDistrict || unit.district === this.selectedDistrict)
    );
    this.setFeedbackMessage(`Found ${this.filteredUnits.length} units.`, 'info');
  }

  // Resets all filter selections and displays all units
  onReset() {
    this.selectedState = '';
    this.selectedDistrict = '';
    this.filteredUnits = [...this.unit];
    this.setFeedbackMessage('Filters reset. Showing all units.', 'info');
  }

  // When state changes, reset district selection
  // onStateChange() {
  //   this.selectedDistrict = '';
  // }
  onNewUnitStateChange() {
    this.newUnitDistrict = '';
  }


  // Sets the unit to be deleted and opens the confirmation modal
  confirmDelete(unit: Unit) {
    this.unitToDelete = unit;
    this.showDeleteConfirm = true;
  }

  reassignUnit(unit: Unit) {
    this.setFeedbackMessage(`Reassigning unit '${unit.name}' in '${unit.district}' (IMplementation pending)`, 'info');
    // Here you would implement the logic to reassign the unit, e.g., open a dialog to select a new region or unit head
  }
   
  

  // Deletes the confirmed unit from the list
  deleteUnit() {
    if (this.unitToDelete) {
      this.unit = this.unit.filter(
        u => u !== this.unitToDelete
      );
      this.onSearch(); // Re-apply filters to update the displayed list
      this.setFeedbackMessage(`Unit '${this.unitToDelete.name}' in '${this.unitToDelete.district}' deleted successfully.`, 'success');
    }
    this.showDeleteConfirm = false;
    this.unitToDelete = null;
  }
  

  // Cancels the delete operation  
  cancelDelete() {
    this.showDeleteConfirm = false;
    this.unitToDelete = null;
    this.setFeedbackMessage('Delete operation cancelled.', 'info');
  }

  // Placeholder for download report logic
  downloadReport() {
    this.setFeedbackMessage('Download Report clicked! (Implementation pending)', 'info');
    // In a real application, you would generate a CSV or PDF here
    // Example: Convert filteredUnits to CSV and trigger download
  }



  // Helper to display feedback messages
  setFeedbackMessage(message: string, type: 'success' | 'error' | 'info') {
    this.feedbackMessage = message;
    // You could add logic here to display different styles based on 'type'
    // For example, by setting a CSS class on the feedback message element
    setTimeout(() => {
      this.feedbackMessage = null; // Clear message after some time
    }, 5000); // Message disappears after 5 seconds
  }

  onLoadStates(){
    
 this.states$ = this.service.getStates().pipe(
    tap(states => console.log('States:', states))
  );
  }
  //onselection of state cites will be loaded here
  onStateSelect(event: Event) {
 const val =  Number((event.target as HTMLSelectElement).value)
    const stateId = Number(val);
    console.log(stateId);
    this.districts$ = this.service.getDistricts(stateId).pipe(
      tap(filtered => console.log('Filtered districts:', filtered)),
      catchError(error => {
        console.error('Error fetching districts:', error);
        return of([]); // fallback empty array
      })
    );
  }
 onStateChange(event:Event){
const val =  Number((event.target as HTMLSelectElement).value)
    const stateId = Number(val);
    console.log(stateId);
    this.districts$ = this.service.getDistricts(stateId).pipe(
      
      tap(filtered => console.log('Filtered districts:', filtered)),
      catchError(error => {
        console.error('Error fetching districts:', error);
        return of([]); // fallback empty array
      })
    );
 }
 onOpenUnitEditModal(unit:any, loc:any){
  this.editUnitModal = true;
   this.editUnitForm.patchValue({
      unitId: unit.id,       // Adjust to your actual property names
      stateId: loc.stateId,
      districtId: loc.districtId
    });
 }
 onCloseEditModel(){
  
 }
 getUnits(){
  this.unitService.getUnits().subscribe(res=>{
    const unitsList = res;
    this.units$ = of(unitsList);
    console.log(unitsList);
  })
 }
addUnitOrganization() {
  const orgnId = localStorage.getItem('organizationId')
  const unitLocation = {
    UnitId: Number(this.unitOrganizationForm.controls.newUnitName.value),
    DistrictId: Number(this.unitOrganizationForm.controls.newUnitDistrict.value),
    // OrganizationId : Number(orgnId)
  };

  this.unitService.addUnitsOrganization(unitLocation).subscribe(res => {
    console.log('Response from backend:', res);
  });
console.log(orgnId);
// console.log(uni);


  this.editUnitModal = false;
}
getUnitOrganization(){
this.unitLocations$ =  this.unitService.getUnitsOrganization()
}
}
