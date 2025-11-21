import { Component, inject, ViewChild } from '@angular/core';
import { InstituteThemeService, Institute } from '../../shared/institute-theme.service';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { catchError, from, map, Observable, of, tap, throwError } from 'rxjs';
import { State } from '../../core/models/states.model';
import { LocationsService } from '../../core/services/locations.service';
import { Districts } from '../../core/models/districts.models';
import { Units } from '../../core/models/units.model';
import { InstituteService } from '../../core/services/institute.service';
import { InstituteData } from '../../core/models/institute.modal';
import { UnitsService } from '../../core/services/units.service';
import { BrowserModule } from '@angular/platform-browser';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { UserService } from '../../core/services/user.service';

@Component({
  imports: [FormsModule, CommonModule, RouterModule, LoadingSpinnerComponent, ReactiveFormsModule],
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
  private userService = inject(UserService)
  units$!: Observable<Units[]>;
  unitCount: number = 0;
  Role: string = '';
  selectedStateName: string | undefined = '';
  selectedDistrictId: string | undefined = '';
  institutes: any[] = [];
  districtList:Districts[]= [];
  organizationId:any;

  //unitHead dashboard data
  unitLoc:any[]=[];
  selectedUnitLoc:any[]=[];
  selectedState:any[]=[];
  // Modal states
  isModalOpen = false;
  isEditMode = false;

  // Feedback message
  feedbackMessage: string = '';
  feedbackMessageType: 'success' | 'error' | 'info' = 'info';

  //loader
  isLoading:boolean = false;

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
  isSuperAdminLoggedIn: boolean = false;
  isUnitHeadLoggedIn : boolean = false;
  isAdminLoggedIn: boolean = false;
  constructor(private instituteService: InstituteThemeService) { }
   @ViewChild('instituteForm') instituteForm!: NgForm;

  ngOnInit(): void {
    // this.loadInstitutes();
    this.loadStates();
    this.onLoadUnits();
    this.getUnitHead()
    this.loadInstitutes();
    this.onLoadInsititutes();
    const userRole = localStorage.getItem('role');
    console.log(userRole);
    if (userRole === 'SUPERADMIN') {
      this.Role = 'Super Admin';
      this.isSuperAdminLoggedIn = true;
    }
    else if (userRole === 'ADMIN') {
      this.Role = 'Admin';
      this.isAdminLoggedIn = true;
    }
    else if (userRole === 'UNITHEAD') {
      this.Role = 'Unit-Head';
      this.isUnitHeadLoggedIn = true;
      this.loadUnitHeadStatistics(); // Load statistics for unit head
    }
  }

  public getEmptyForm() {
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
      this.organizationId = id
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

  saveInstitute(form:NgForm) {
    this.isLoading = true;
    if (this.isEditMode) {
      const updatedInstitute = {
        id: this.organizationId,
        name: this.form.name,
        districtId: this.form.address.district,
        logoUrl: this.form.logoUrl,
        storageContainerName: this.form.storageInfo.storageContainerName,
        storageContainerNamePublic: this.form.storageInfo.storageContainerNamePublic,
        pinCode:this.form.address.pincode
      }
      this.instituteServices.updateInstitutes(updatedInstitute,this.organizationId).subscribe({
       next:(res:any)=>{
         alert("Institute Updated successfully");
        console.log(res);
        this.onLoadInsititutes();
       },
       error:(err:any)=> {
       if (err.status === 404) {
        alert("Institute not found)");
      } else if (err.status === 500) {
        alert("Server error. Please try again later");
      } else if (err.error?.message) {
        alert("Error: " + err.error.message);
      } else {
        alert("An unexpected error occurred, Failed to update Institute");
      }
       },
      })

    } else {
      const newInstitute = {
        name: this.form.name,
        districtId: this.form.address.district,
        pincode: this.form.address.pincode,
        storageContainerName: this.form.storageInfo.storageContainerName

      };
      console.log(newInstitute);
      this.instituteServices.addInstitute(newInstitute).subscribe({
        next: (response) => {
          alert("Added institute Successfully")
          console.log('Institute added successfully:', response);
          this.isLoading = false;
          this.onLoadInsititutes();
        },
        error: (err) => {
          alert("Failed to add institute, Please try again later")
          console.error('Error adding institute:', err);
          this.isLoading = false;
        }
      });
    }
    this.isModalOpen = false;
    form.reset();
    this.loadInstitutes();
  }
  resetForm(form:NgForm){
    form.reset();
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

  closeModal(form:NgForm): void {
    form.reset()
    this.isModalOpen = false;
    this.instituteToEdit = null;
    this.form = this.getEmptyForm();
  }

  confirmDelete(institute: Institute, event:Event): void {
    this.isDeleteConfirmOpen = true;
    this.instituteToDelete = institute;
     const button = (event.target as HTMLElement).closest('button');
    if (button) {
      console.log('Button value:', button.getAttribute('value'));
      const id = Number(button.getAttribute('value'));
      console.log('Parsed id:', id);
      this.organizationId = id
    }
  }

  deleteInstitute(): void {
    this.isLoading = true;
    this.isDeleteConfirmOpen = false;
    this.instituteServices.deleteInstituteById(this.organizationId).pipe(
      tap(res=>{
      }),
      catchError(error=>{
        return throwError(()=>error)
      })
    ).subscribe({
      next:(res:any)=>{
        this.isLoading = false;
       alert("Deleted institute Successfully")
       this.onLoadInsititutes();
       
      },
      error:(err:any)=>{
        this.isLoading = false;
        alert("Failed to delete institute, Please try again later")
      }
    })

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
    this.isLoading = true;
    this.instituteServices.getInstitutes().subscribe( {
      next:(res:any)=>{
        this.isLoading = false;
       this.institutes = res.items || [];
       console.log(this.institutes);
      },
      error:(err:any)=>{
        this.isLoading = false
        // alert("Failed to load Institutes"+ JSON.stringify(err.status),)
      }
    });
  }
  unitHeads:any[]=[];
  unitHeadCount:any;
  getUnitHead() {
    this.userService.getUnitHead().subscribe({
      next: (res: any) => {
        if (res && Array.isArray(res)) {
          this.unitHeads = res;
          console.log(this.unitHeads.length);
          this.unitHeadCount = this.unitHeads.length
          // After fetching, initialize the filtered array with all data
        } else {
          this.unitHeads = [];
        }
      },
      error: (err) => {
        console.error('Error fetching unit heads:', err);
        this.unitHeads = [];
      }
    });
  }

  // ===== UNIT HEAD STATISTICS =====
  unitHeadStats = {
    assignedUnitsCount: 0,
    trainersCount: 0,
    pendingApprovalsCount: 0,
    approvedThisMonthCount: 0
  };

  /**
   * Load statistics for unit head dashboard
   */
  loadUnitHeadStatistics() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      const unitHeadId = parseInt(userId);
      this.userService.getUnitHeadStatistics(unitHeadId).subscribe({
        next: (stats) => {
          this.unitHeadStats = stats;
          console.log('Unit Head Statistics:', stats);
        },
        error: (err) => {
          console.error('Error fetching unit head statistics:', err);
        }
      });
    }
  }


}