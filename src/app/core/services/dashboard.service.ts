import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Units } from '../models/units.model';
import { Observable } from 'rxjs';
import { Endpoints } from '../../shared/endpoints.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private httpClinet = inject(HttpClient);
  private token = localStorage.getItem('authtoken')
  // getUnits():Observable<Units[]>{
  //   const endPoint = Endpoints.units;
  //  const headers = new HttpHeaders({
  //   'Authorization': `Bearer ${this.token}`
  //  })
  //   return this.httpClinet.get<Units[]>(`${endPoint}`,{headers})
  // }
  constructor() { }
}
