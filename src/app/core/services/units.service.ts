import { HttpClient } from '@angular/common/http';
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
  private organizationUnit = Endpoints.organizationUnit;

  //units list master data
  getUnits():Observable<Units[]>{
    const endpoint = Endpoints.units;
    return this.httpClient.get<Units[]>(`${endpoint}`)
  }

  //to add units under org
  addOrganizationUnit(Data :{unitId: number ;districtId: number}):Observable<unitOragnization[]>{
    return this.httpClient.post<unitOragnization[]>(this.organizationUnit,Data)
  }

  //list of units added under org
  getOrganizationUnit():Observable<any[]>{
    return this.httpClient.get<any[]>(this.organizationUnit)
  }
  deleteOrganizationUnit(unitData:any){
    const options = {
      body: unitData
    };
    return this.httpClient.delete(this.organizationUnit,options);
  }

  updateOrgUnit(orgUnitId:number, orgUnitData:any){
    return this.httpClient.patch(`${this.organizationUnit}/${orgUnitId}`,orgUnitData)
  }

  mapUnit(unitAndUnitHeadData:any){
    return this.httpClient.post(`${this.organizationUnit}/unitHeads/bulk`,unitAndUnitHeadData)
  }

  getSpecificUnitHeadUnitLoc(unitHeadId:number){
    const endpoint = Endpoints.getUnitHead
    return this.httpClient.get(`${endpoint}/${unitHeadId}/units`)
  }
  mapStaffUnit(staffUnit:any){
    return this.httpClient.post(`${this.organizationUnit}/trainers`,staffUnit)
  }

  unMapStaffUnit(staffUnit:any){
    const options= {
      body:staffUnit
    }
    return this.httpClient.delete(`${this.organizationUnit}/trainers`,options)
  }
  constructor() {

   }
}
