import { CommonModule } from '@angular/common';
import { Component, inject, Input, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { State } from '../../core/models/states.model';
import { catchError, finalize, firstValueFrom, Observable, of, tap } from 'rxjs';
import { LocationsService } from '../../core/services/locations.service';
import { Districts } from '../../core/models/districts.models';
import { UnitsService } from '../../core/services/units.service';
import { Units } from '../../core/models/units.model';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { NgxPaginationModule } from 'ngx-pagination';
interface Unit {
  name: string;
  state: string;
  district: string;
}
@Component({
  selector: 'app-edit-units',
  imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, FilterPipeModule, LoadingSpinnerComponent, NgxPaginationModule],
  templateUrl: './edit-units.component.html',
  styleUrl: './edit-units.component.css'
})
export class EditUnitsComponent implements OnInit {
  states$!: Observable<State[]>
  districts$!: Observable<Districts[]>
  selectedStateId: number | undefined;
  units$!: Observable<Units[]>;
  unitLocations$!: Observable<any[]>;
  @Input() filterForm!: FormGroup;

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
  editUnitModal: boolean = false;

  //loader
  isLoading: boolean = false;

  //assigning unit details
  unitData: any;
  //pagination
  p: number = 1;
  total: number = 0;

  unitCount: any;
  unitLocations: any[] = [];

  orgUnitLocId: any;

  //response messages
  //to disable and enable
  errorMsg: boolean = false;
  successMsg: boolean = false;
  //display text
  errorText: string = '';
  successText: string = '';

  private service = inject(LocationsService);
  private unitService = inject(UnitsService)

  unitOrganizationForm = new FormGroup({
    newUnitName: new FormControl('', [Validators.required]),
    newUnitState: new FormControl('', [Validators.required]),
    newUnitDistrict: new FormControl('', [Validators.required])
  })
  editUnitForm = new FormGroup({
    unitId: new FormControl('', [Validators.required]),
    stateId: new FormControl('', [Validators.required]),
    districtId: new FormControl('', [Validators.required])
  });
  ngOnInit(): void {
    // Initialize with some dummy data for units
    // this.filteredUnits = [...this.unit];
    this.onLoadStates();
    this.getUnits();
    this.getUnitOrganization();
    // this.onLoadStates();
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
  onReset(form:NgForm) {
   form.resetForm({ state: '', district: '' });
  }

  // When state changes, reset district selection
  // onStateChange() {
  //   this.selectedDistrict = '';
  // }
  onNewUnitStateChange() {
    this.newUnitDistrict = '';
  }


  // Sets the unit to be deleted and opens the confirmation modal
  confirmDelete(unit: any) {
    this.showDeleteConfirm = true;
    this.unitData = {
      unitId: unit.unitId,
      districtId: unit.districtId
    }
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
    // this.setFeedbackMessage('Delete operation cancelled.', 'info');
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

  onLoadStates() {
    this.states$ = this.service.getStates().pipe(
      tap(states => console.log('States:', states))
    );
  }
  //onselection of state cites will be loaded here
  onStateSelect(event: Event) {
    const val = Number((event.target as HTMLSelectElement).value)
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
  onStateChange(event: Event) {
    const val = Number((event.target as HTMLSelectElement).value)
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

  onCloseEditModel() {
    this.editUnitModal = false;
  }
  getUnits() {
    this.units$ = this.unitService.getUnits().pipe(
      tap(list => console.log('Units list:', list)),
      catchError(err => {
        console.error('Failed to fetch units', err);
        return of([]); // fallback case
      })
    );
  }
  async addUnitOrganization() {
    this.isLoading = true;
    const orgnId = localStorage.getItem('organizationId')
    const stateId = Number(this.unitOrganizationForm.controls.newUnitState.value);
    const unitLocation = {
      unitId: Number(this.unitOrganizationForm.controls.newUnitName.value),
      districtId: Number(this.unitOrganizationForm.controls.newUnitDistrict.value),
      // OrganizationId : Number(orgnId)
    };
    try {
      const states = await firstValueFrom(this.states$);
      const selectedState = states.find(state => state.id === stateId);
      const dist = await firstValueFrom(this.districts$);
      const selectedDist = dist.find(d => d.id === unitLocation.districtId);
      const unit = await firstValueFrom(this.units$);
      const selectedUnit = unit.find(u => u.id === unitLocation.unitId);

      if (!selectedState) {
        console.error('Selected state not found');
        return;
      }
      this.unitService.addOrganizationUnit(unitLocation).subscribe(
        {
          next: (res: any) => {
            this.isLoading = false;
             window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
            this.setResponseMsg("Added Organization Unit successfully.", true);
            console.log("Unit added successfully");
            this.getUnitOrganization();
            // Reset the form and close the modal on successful addition
            // Reset the form with explicit default values to show the placeholders
            this.unitOrganizationForm.reset({ newUnitName: '', newUnitState: '', newUnitDistrict: '' });
          },
          error: (err: any) => {
            this.isLoading = false;
            this.setResponseMsg("Failed to add Organization Unit. Please try again.", false);
            console.log("Failed to add unit", err);
            console.log(err);
          },

        });
      console.log(orgnId);
      this.editUnitModal = false;
    }
    catch (error) {
      this.isLoading = false
      console.error('Failed to fetch states', error);
    }
    this.unitOrganizationForm.reset();
  }
  getUnitOrganization() {
    this.isLoading = true;
    this.unitService.getOrganizationUnit().subscribe({
      next: (units: any[]) => {
        this.unitLocations = units;
        this.isLoading = false;
        console.log('Unit locations refreshed:', this.unitLocations);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = true;
        if (err.status === 404) {
          this.errorText = "No units found";
        } else if (err.status === 500) {
          this.errorText = "Server error. Please try again later";
        } else if (err.error?.message) {
          this.errorText = `Error: ${err.error.message}`;
        } else {
          this.errorText = "An unexpected error occurred.";
        }
        console.error('Error fetching unit organization:', err);
      }
    });
  }
  onOpenUnitEditModal(unit: any) {
    this.orgUnitLocId = unit.orgUnitLocationId
    console.log(this.orgUnitLocId);

    this.editUnitModal = true;
    this.editUnitForm.patchValue({
      unitId: unit.unitId,
      stateId: unit.stateId,
      districtId: unit.districtId
    });
    if (unit.stateId) {
      this.districts$ = this.service.getDistricts(unit.stateId).pipe(
        tap(filtered => console.log('Filtered districts (edit):', filtered)),
        catchError(error => {
          console.error('Error fetching districts for edit modal:', error);
          return of([]);
        })
      );
    }
    console.log(this.editUnitForm);

    console.log(unit);

  }

  saveUpdateOrgUnit() {
    this.isLoading = true;
    const updateOrgUnit = {
      unitId: this.editUnitForm.controls.unitId.value,
      districtId: this.editUnitForm.controls.districtId.value
    }
    this.unitService.updateOrgUnit(this.orgUnitLocId, updateOrgUnit).subscribe({
      next: () => {
        this.editUnitModal = false;
         window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
        this.isLoading = false;
        this.setResponseMsg("Orgnaization Unit updated successfully.", true);
        this.unitOrganizationForm.reset();
        this.getUnitOrganization()
        this.unitOrganizationForm.reset({ newUnitName: '', newUnitState: '', newUnitDistrict: '' });
      },
      error: () => {
      this.isLoading = false;
       window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
        this.setResponseMsg("Failed to update Organization Unit. Please try again.", false);
      }
    })
  }


  deleteOrganizationUnit() {
    this.isLoading = true;
    this.showDeleteConfirm = false;
    this.unitService.deleteOrganizationUnit(this.unitData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
         window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
        this.setResponseMsg("Orgnaization Unit deleted successfully.", true);
        // alert("Unit deleted Successfully")
        console.log(res);
        this.getUnitOrganization();
      },
      error: (err: any) => {
        this.isLoading = false;
         window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
        this.setResponseMsg("Failed to delete Organization Unit. Please try again.", false);
      }
    })
  }
  closeResponse() {
    this.errorMsg = false;
    this.successMsg = false;
  }
  onPageChange(event: number) {
    this.p = event;
  }
  itemFilter: any = {
    stateId: '',
    districtId: ''
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
    }, 5000);
  }
}
