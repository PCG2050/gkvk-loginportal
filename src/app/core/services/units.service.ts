import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';
import { Observable } from 'rxjs';
import { Admins } from '../models/admins.model';
import { unitOragnization, Units } from '../models/units.model';

@Injectable({
  providedIn: 'root'
})
export class UnitsService {
  private httpClient = inject(HttpClient);
  private token = localStorage.getItem('authtoken');
  private unitOrganization = Endpoints.organizationUnit;
  getUnits():Observable<Units[]>{
    const endpoint = Endpoints.units;
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.get<Units[]>(`${endpoint}`,{headers})
  }

  addUnitsOrganization(Data :{UnitId: number ;DistrictId: number}):Observable<unitOragnization[]>{
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.post<unitOragnization[]>(this.unitOrganization,Data,{headers})
  }
  getUnitsOrganization():Observable<any[]>{
     const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.get<any[]>(this.unitOrganization, {headers})
  }

  addUnitHead(unitHeadData:any){
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    const endpoint = Endpoints.addUnitHead
    return this.httpClient.post(endpoint,unitHeadData, {headers})
  }
  constructor() { }
}
