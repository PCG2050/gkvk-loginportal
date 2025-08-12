import { Component, inject } from '@angular/core';
import { InstituteThemeService, Institute } from '../../shared/institute-theme.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { State } from '../../core/models/states.model';
import { LocationsService } from '../../core/services/locations.service';
import { Districts } from '../../core/models/districts.models';
import { DashboardService } from '../../core/services/dashboard.service';
import { Units } from '../../core/models/units.model';
import { InstituteService } from '../../core/services/institute.service';
import { InstituteData } from '../../core/models/institute.modal';
import { UnitsService } from '../../core/services/units.service';

@Component({
  imports: [FormsModule, CommonModule, RouterModule],
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  //  institutes: Institute[] = [];
  private router = inject(Router);
  private service = inject(LocationsService);
  private unitService = inject(UnitsService);
  private instituteServices = inject(InstituteService);
  units$!: Observable<Units[]>;
  unitCount: number = 0;
  Role: string = '';
  selectedStateName: string | undefined = '';
  selectedDistrictId: string | undefined = '';
  institutes: any[] = [];
  districtList:Districts[]= [];
  instituteId: number | undefined;
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
      storageContainerName: string;
      storageContainerNamePublic: string;
    };
    address: {
      state: string | number;
      district: string | number;
      pincode: string;
    };
  } = this.getEmptyForm();

  // Used for editing
  instituteToEdit: Institute | null = null;

  // Delete confirmation
  isDeleteConfirmOpen = false;
  instituteToDelete: Institute | null = null;
  //states
  states$!: Observable<State[]>
  //specific state districts
  districts$!: Observable<Districts[]>
  IsSuperAdminLoggedIn: boolean = false;
  IsAdminLoggedIn: boolean = false;
  constructor(private instituteService: InstituteThemeService) { }

  ngOnInit(): void {
    this.loadInstitutes();
    this.loadStates();
    this.onLoadUnits();
    this.loadInstitutes();
    this.onLoadInsititutes();
    const userRole = localStorage.getItem('role');
    console.log(userRole);
    if (userRole === 'SUPERADMIN') {
      this.Role = 'Super Admin';
      this.IsSuperAdminLoggedIn = true;
    }
    else if (userRole === 'ADMIN') {
      this.Role = 'Admin';
      this.IsAdminLoggedIn = true;
    }
    else if (userRole === 'UNITHEAD') {
      this.Role = 'Unit-Head'
    }
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
        storageContainerName: '',
        storageContainerNamePublic: ''
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
    // this.institutes = this.instituteService.getInstitutes();
  }

  openAddModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.instituteToEdit = null;
    this.form = this.getEmptyForm();
  }

  editInstitute(institute: InstituteData, event: Event): void {
    const button = (event.target as HTMLElement).closest('button');
    if (button) {
      console.log('Button value:', button.getAttribute('value'));
      const id = Number(button.getAttribute('value'));
      console.log('Parsed id:', id);
      this.instituteId = id
    }
    // console.log(institute);
    
    
    this.isModalOpen = true;
    this.isEditMode = true;
    // this.instituteToEdit = institute;
    
   const state = this.statesList.find(
    s => s.name.toLowerCase() === institute.stateName?.toLowerCase()
  );
  const stateId = state?.id;
    // Pre-fill form
     if (stateId) {
    this.form.address.state = stateId;

    // Load districts for that state before setting district
    this.districts$ = this.service.getDistricts(stateId).pipe(
      tap(districts => {
        this.districtList = districts;

        // Convert district name to district ID
        const district = districts.find(
          d => d.name.toLowerCase() === institute.districtName?.toLowerCase()
        );
        const districtId = district?.id;

        // Assign full form after districts load
        this.form = {
          name: institute.name,
          logoUrl: institute.logoUrl || '',
          communicationChannels: {
            emailEnabled: false,
            phoneEnabled: false
          },
          storageInfo: {
            storageContainerName: institute.storageContainerName || '',
            storageContainerNamePublic: institute.storageContainerNamePublic || ''
          },
          address: {
            state: stateId,
            district: districtId || '',
            pincode: institute.pincode || ''
          }
        };
      })
    );
  } else {
    console.error('State not found for:', institute.stateName);
    this.districts$ = of([]);
  }

    
  }

  saveInstitute(): void {

    if (!this.form.name || !this.form.storageInfo.storageContainerName || !this.form.storageInfo.storageContainerNamePublic) {
      alert('Please fill all required fields');
      return;
    }

    if (this.isEditMode && this.instituteToEdit) {
      const updatedInstitute = {
        id: this.instituteId,
        name: this.form.name,
        districtName: this.form.address.district,
        logoUrl: this.form.logoUrl,
        storageContainerName: this.form.storageInfo.storageContainerName,
        storageContainerNamePublic: this.form.storageInfo.storageContainerNamePublic
      }
      // communicationChannels: {
      //   emailEnabled: this.form.communicationChannels.emailEnabled,
      //   phoneEnabled: this.form.communicationChannels.phoneEnabled
      // },
      // storageInfo: {
      //   storageContainerName: this.form.storageInfo.storageContainerName,
      //   storageContainerNamePublic: this.form.storageInfo.storageContainerNamePublic
      // },
      // address: {
      //   state: this.form.address.state,
      //   district: this.form.address.district,
      //   pincode: this.form.address.pincode
      // }
      this.instituteServices.updateIntitutes(updatedInstitute).subscribe(res=>{
        console.log(res);
        
      })
      // this.instituteService.updateInstitute(this.instituteToEdit.id, updatedInstitute);

    } else {
      const newInstitute = {
        name: this.form.name,
        districtId: this.form.address.district,
        pincode: this.form.address.pincode,
        storageContainerName: this.form.storageInfo.storageContainerName
        // id: 0, // will be set by service
        // name: this.form.name,
        // logoUrl: this.form.logoUrl,
        // communicationChannels: {
        //   emailEnabled: this.form.communicationChannels.emailEnabled,
        //   phoneEnabled: this.form.communicationChannels.phoneEnabled
        // },
        // storageInfo: {
        //   storageContainerName: this.form.storageInfo.storageContainerName,
        //   storageContainerNamePublic: this.form.storageInfo.storageContainerNamePublic
        // },

        // address: {
        //   state: this.selectedStateName,
        //   district: this.form.address.district,
        //   pincode: this.form.address.pincode
        // }
      };
      console.log(newInstitute);

      this.instituteServices.addInstitute(newInstitute).subscribe({
        next: (response) => {
          console.log('Institute added successfully:', response);
        },
        error: (err) => {
          console.error('Error adding institute:', err);
        }
      });
      // this.instituteService.addInstitute(newInstitute);
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
  navigateToManageAdmins(event:Event): void {
    const button = (event.target as HTMLElement).closest('button');
    if (button) {
      console.log('Button value:', button.getAttribute('value'));
     const id = Number(button.getAttribute('value'));
      console.log('Parsed id:', id);
      localStorage.setItem('selectedInstituteId',id.toString() )
    }
    this.router.navigateByUrl('/manageAdmins')
    console.log("admin");
  }
  statesList: State[] = [];

  loadStates() {
    this.service.getStates().subscribe(states => {
      this.statesList = states;
      this.states$ = of(states); // keep this for async pipe if used
      console.log('States loaded:', states);
    });
  }

  //onselection of state cites will be loaded here
  onStateSelect(stateId: number | null) {
  console.log('Selected State ID:', stateId);

  const selectedState = this.statesList.find(state => state.id === stateId);
  this.selectedStateName = selectedState?.name ?? '';

  if (selectedState) {
    this.districts$ = this.service.getDistricts(selectedState.id).pipe(
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



  onLoadUnits() {
    this.unitService.getUnits().subscribe({
      next: units => {
        console.log(units);

        this.unitCount = units.length;
        console.log('Unit count:', this.unitCount);
      },
      error: err => {
        console.error('Error loading unit count:', err);
      }
    });
  }
  onSelectDistrict(event: Event) {
    console.log("dist");
    const dval = event.target as HTMLSelectElement;
    console.log(dval);
    const distId = dval.value;
    console.log(distId);
  }
  onLoadInsititutes() {
    this.instituteServices.getInstitutes().subscribe((res: any) => {
      this.institutes = res.items || [];
      console.log(this.institutes);
    });
  }
}