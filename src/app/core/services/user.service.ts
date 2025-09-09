import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Admins } from '../models/admins.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private httpClient = inject(HttpClient);
  private endpoint = Endpoints.user;

  private token = localStorage.getItem('authtoken');
  getUser(userId: number) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.get(`${this.endpoint}/profile/${userId}`, { headers })
  }
  updateUser(userId: number, updateDto: any) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.patch(`${this.endpoint}/${userId}`, updateDto, { headers })
  }
  getAdmins(instituteId: number): Observable<Admins[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    let endPoint = Endpoints.institutes
    return this.httpClient.get<Admins[]>(`${endPoint}/${instituteId}/admins`, { headers });
  }
  addAdmin(instituteId: number, adminData: any): Observable<Admins[]> {
    const endPoint = Endpoints.institutes;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.post<Admins[]>(`${endPoint}/${instituteId}/users`, adminData, { headers },)
  }

  addUnitHead(instituteId: number, unitHeadData: any) {
    const endpoint = Endpoints.unitHead;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.post(`${endpoint}`, unitHeadData, { headers })
  }
  getUnitHead() {
    const endpoint = Endpoints.unitHead;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.get(`${endpoint}/Details/all`, { headers })
  }
  updateUnitHead(unitHeadId: number, unitHeadData: any) {
    const endPoint = Endpoints.unitHead;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.patch(`${endPoint}/UnitHead/${unitHeadId}`, unitHeadData, { headers })
  }

  deleteUnitHead(unitHeadId: number) {
    const endPoint = Endpoints.unitHead;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })

    return this.httpClient.delete(`${endPoint}/${unitHeadId}/UnitHead`, { headers })
  }
  addStaff(staffData: any) {
    const endPoint = Endpoints.staff;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.post(`${endPoint}`, staffData, { headers },)

  }
  getStaff() {
    const endPoint = Endpoints.staff;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.get(`${endPoint}/with-assignments`, { headers })
  }
  updateStaff(staffId: number, staffData: any) {
    const endPoint = Endpoints.staff;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.patch(`${endPoint}/${staffId}`, staffData, { headers })
  }
  deleteStaff(staffId: number) {
    const endPoint = Endpoints.staff;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.delete(`${endPoint}/${staffId}`, { headers })
  }

  constructor() { }
}
