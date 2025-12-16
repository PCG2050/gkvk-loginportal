import { HttpClient } from '@angular/common/http';
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

  getUser(userId: number) {
    return this.httpClient.get(`${this.endpoint}/profile/${userId}`)
  }
  updateUser(userId: number, updateDto: any) {
    return this.httpClient.patch(`${this.endpoint}/${userId}`, updateDto)
  }
  getAdmins(instituteId: number): Observable<Admins[]> {
    let endPoint = Endpoints.institutes
    return this.httpClient.get<Admins[]>(`${endPoint}/${instituteId}/admins`);
  }
  addAdmin(instituteId: number, adminData: any): Observable<Admins[]> {
    const endPoint = Endpoints.institutes;
    return this.httpClient.post<Admins[]>(`${endPoint}/${instituteId}/users`, adminData)
  }

  addUnitHead(instituteId: number, unitHeadData: any) {
    const endpoint = Endpoints.unitHead;
    return this.httpClient.post(`${endpoint}`, unitHeadData)
  }
  getUnitHead() {
    const endpoint = Endpoints.unitHead;
    return this.httpClient.get(`${endpoint}/Details/all`)
  }
  updateUnitHead(unitHeadId: number, unitHeadData: any) {
    const endPoint = Endpoints.unitHead;
    return this.httpClient.patch(`${endPoint}/UnitHead/${unitHeadId}`, unitHeadData)
  }

  deleteUnitHead(unitHeadId: number) {
    const endPoint = Endpoints.unitHead;
    return this.httpClient.delete(`${endPoint}/${unitHeadId}/UnitHead`)
  }
  addStaff(staffData: any) {
    const endPoint = Endpoints.staff;
    return this.httpClient.post(`${endPoint}`, staffData)
  }
  getStaff() {
    const endPoint = Endpoints.staff;
    return this.httpClient.get(`${endPoint}/with-assignments`)
  }
  updateStaff(staffId: number, staffData: any) {
    const endPoint = Endpoints.staff;
    return this.httpClient.patch(`${endPoint}/${staffId}`, staffData)
  }
  deleteStaff(staffId: number) {
    const endPoint = Endpoints.staff;
    return this.httpClient.delete(`${endPoint}/${staffId}`)
  }

  // ===== UNIT HEAD STATISTICS METHODS =====

  /**
   * Get statistics for a unit head dashboard
   * Returns counts for units, trainers, pending approvals, and approved entries
   */
  getUnitHeadStatistics(unitHeadId: number): Observable<{
    assignedUnitsCount: number;
    trainersCount: number;
    pendingApprovalsCount: number;
    approvedThisMonthCount: number;
  }> {
    return this.httpClient.get<{
      assignedUnitsCount: number;
      trainersCount: number;
      pendingApprovalsCount: number;
      approvedThisMonthCount: number;
    }>(`${Endpoints.unitHead}/${unitHeadId}/statistics`);
  }

   /**
   * Get units assigned to a specific unit head
   */
  getUnitHeadAssignedUnits(unitHeadId: number) {
    return this.httpClient.get<{
      assignedUnitsCount: number;
      trainersCount: number;
      pendingApprovalsCount: number;
      approvedThisMonthCount: number;
    }>(`${Endpoints.unitHead}/${unitHeadId}/units`);
  }

  /**
   * Get trainers managed by a specific unit head
   */
  getUnitHeadTrainers(unitHeadId: number) {
    return this.httpClient.get<{
      assignedUnitsCount: number;
      trainersCount: number;
      pendingApprovalsCount: number;
      approvedThisMonthCount: number;
    }>(`${Endpoints.unitHead}/${unitHeadId}/trainers`);
  }

  constructor() { }
}
