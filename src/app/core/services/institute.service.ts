import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Endpoints } from '../../shared/endpoints.model';
import { Institute } from '../../shared/institute-theme.service';
import { AzureStorageService } from './azure-storage.service';

@Injectable({
  providedIn: 'root'
})
export class InstituteService {
  private httpClient = inject(HttpClient);
  private azureStorageService = inject(AzureStorageService);
  private endpoint = Endpoints.institutes;
  private token = localStorage.getItem('authtoken')
  constructor() { }
  /**
   * Add a new institute/organization
   * This will create the institute in the backend and automatically create Azure containers
   */
  addInstitute(instituteData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    // The backend will handle container creation automatically
    // when the organization is created (see AZURE_STORAGE_BACKEND_IMPLEMENTATION.md)
    return this.httpClient.post(this.endpoint, instituteData, { headers });
  }

  /**
   * Add institute with explicit container creation flow
   * Use this method if you want to handle container creation separately from the backend
   * @param instituteData Institute data including container names
   */
  addInstituteWithContainers(instituteData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    // Step 1: Create the institute
    return this.httpClient.post(this.endpoint, instituteData, { headers }).pipe(
      switchMap((response: any) => {
        const organizationId = response.id;

        // Step 2: Create Azure containers for the organization
        return this.azureStorageService.createOrganizationContainers(
          organizationId,
          instituteData.storageContainerName,
          instituteData.storageContainerName + '-public'
        ).pipe(
          tap(containerResult => {
            console.log('✅ Containers created successfully:', containerResult);
          }),
          // Return the original response with container info
          switchMap(containerResult => {
            return this.httpClient.get(`${this.endpoint}/${organizationId}`, { headers });
          }),
          catchError(error => {
            console.error('⚠️ Container creation failed, but organization was created:', error);
            // Still return the organization even if container creation failed
            return this.httpClient.get(`${this.endpoint}/${organizationId}`, { headers });
          })
        );
      })
    );
  }
  getInstitutes():Observable<Institute[]>{
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.get<Institute[]>(this.endpoint,{headers});
  }
  updateInstitutes(updatedIntititeData:any,organizationId:number){
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
    return this.httpClient.patch(`${this.endpoint}/${organizationId}`, updatedIntititeData,{headers})
  }
  getInstituteById(instituteId:number){
    const headers = new HttpHeaders({
      'Authorization':`Bearer ${this.token}`
    })
    return this.httpClient.get(`${this.endpoint}/${instituteId}`)
  }
  deleteInstituteById(instituteId:number){
    const headers = new HttpHeaders({
      'Authorization':`Bearer ${this.token}`
    })
    return this.httpClient.delete(`${this.endpoint}/${instituteId}`,{headers})
  }
}
