import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Endpoints } from '../../shared/endpoints.model';
import { Institute } from '../../shared/institute-theme.service';

@Injectable({
  providedIn: 'root'
})
export class InstituteService {
  private httpClient = inject(HttpClient);
  private endpoint = Endpoints.institutes;
  private token = localStorage.getItem('authtoken')
  constructor() { }
  addInstitute(instituteData:any){
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    })
 return this.httpClient.post(this.endpoint, instituteData, {headers});
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
