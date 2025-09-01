import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';
import { Observable } from 'rxjs';
import { Admins } from '../models/admins.model';
import { unitOragnization, Units } from '../models/units.model';
import { UserService } from './user.service';
import { EditUnitsComponent } from '../../pages/edit-units/edit-units.component';

@Injectable({
  providedIn: 'root'
})
export class UnitsService {
  private httpClient = inject(HttpClient);
  private token = localStorage.getItem('authtoken');
  private organizationUnit = Endpoints.organizationUnit;

  //units list master data
  getUnits():Observable<Units[]>{
    const endpoint = Endpoints.units;
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.get<Units[]>(`${endpoint}`,{headers})
  }

  //to add units under org
  addOrganizationUnit(Data :{unitId: number ;districtId: number}):Observable<unitOragnization[]>{
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.post<unitOragnization[]>(this.organizationUnit,Data,{headers})
  }

  //list of units added under org
  getOrganizationUnit():Observable<any[]>{
     const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.get<any[]>(this.organizationUnit, {headers})
  }
  deleteOrganizationUnit(unitData:any){
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
     const options = {
    headers,
    body: unitData
  };
    return this.httpClient.delete(this.organizationUnit,options);
  }

  updateOrgUnit(orgUnitId:number, orgUnitData:any){
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.patch(`${this.organizationUnit}/${orgUnitId}`,orgUnitData,{headers})
  }

  mapUnit(unitAndUnitHeadData:any){
     const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.post(`${this.organizationUnit}/unitHeads/bulk`,unitAndUnitHeadData, {headers})
  }

  getSpecificUnitHeadUnitLoc(unitHeadId:number){
    const endpoint = Endpoints.getUnitHead
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.get(`${endpoint}/${unitHeadId}/units`, {headers})
  }
  mapStaffUnit(staffUnit:any){
     const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.post(`${this.organizationUnit}/trainers`,staffUnit,{headers})
  }

  unMapStaffUnit(staffUnit:any){
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    const options= {
      headers,
      body:staffUnit
    }
    return this.httpClient.delete(`${this.organizationUnit}/trainers`,options)
  }
  constructor() {

   }
}
