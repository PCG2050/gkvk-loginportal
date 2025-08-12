import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Admins } from '../models/admins.model';
import { Endpoints } from '../../shared/endpoints.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private httpClient = inject(HttpClient);
  constructor() { }
  private token = localStorage.getItem('authtoken');

  getAdmins(instituteId:number): Observable<Admins[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    let endPoint = Endpoints.addAdmin
    return this.httpClient.get<Admins[]>(`${endPoint}/${instituteId}/admins`, { headers });
  }
   addAdmin(instituteId:number, adminData:any):Observable<Admins[]>{
      const endPoint = Endpoints.addAdmin;
      const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
      return this.httpClient.post<Admins[]>(`${endPoint}/${instituteId}/users`,adminData,{headers},)
    }
}
