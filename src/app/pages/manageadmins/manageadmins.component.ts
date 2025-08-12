import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { filter, map, Observable, tap } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { Admins } from '../../core/models/admins.model';

@Component({
  selector: 'app-manageadmins',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manageadmins.component.html',
  styleUrl: './manageadmins.component.css'
})
export class ManageadminsComponent implements OnInit{
  private router = inject(Router);
  isAdminTabActive:boolean = false;
  isManageAdminTabActive:boolean = true;
  adminTab:boolean = false;
  manageAdminTab:boolean = true;
  Role:string = '';
  admins$ !:Observable<Admins[]>

  private service = inject(AdminService);
  AdminForm = new FormGroup({
    firstName : new FormControl('',[Validators.required]),
    lastName: new FormControl('',[Validators.required]),
    phoneNumber : new FormControl('', [Validators.required]),
    email : new FormControl('',[Validators.required]),
    password: new FormControl('',[Validators.required])
  })
onBackToDashBoard(){
this.router.navigateByUrl('/dashboard')
}
addAdminTab(){
  this.isAdminTabActive = true;
  this.isManageAdminTabActive = false;
  this.adminTab = true;
  this.manageAdminTab = false;
}
manageAdminTabEditor(){
  this.isManageAdminTabActive = true;
  this.isAdminTabActive = false;
  this.manageAdminTab = true;
  this.adminTab= false;
}
ngOnInit(): void {
  const userRole = localStorage.getItem('role');
  // console.log(userRole);
  if(userRole === 'ADMIN'){
    this.Role = 'Admin'
  }
  else if(userRole === 'UNITHEAD') {
    this.Role = 'Unit-Head'
  }
  this.getAdmins();
}

getAdmins(){
  const instituteId = localStorage.getItem('selectedInstituteId');
  const id = Number(instituteId)
 this.admins$ = this.service.getAdmins(id).pipe(
  tap(admins =>{
    console.log(admins);
  }
  ));
 console.log(this.admins$);
}
addAdmins(){
  const organizationId = localStorage.getItem('selectedInstituteId');
  const id = Number(organizationId)
  const adminData:Admins = {
    // Id : Number(organizationId),
    firstName : this.AdminForm.value.firstName || '',
    lastName : this.AdminForm.value.lastName || '',
    email : this.AdminForm.value.email || '',
    password : this.AdminForm.value.password || '',
    phone : this.AdminForm.value.phoneNumber || '',
    organizationId : Number(organizationId),
    role: 3,
    isDeactivated:false
  }
  this.service.addAdmin(id, adminData).subscribe(res=>{
    console.log(res);
  })
  console.log(adminData);
  
}
}
