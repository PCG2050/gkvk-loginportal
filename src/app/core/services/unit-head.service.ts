import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';

@Injectable({
  providedIn: 'root'
})
export class UnitHeadService {
  private httpClient = inject(HttpClient)
  private token = localStorage.getItem('authtoken')
  private usersEndpoint = Endpoints.admins
  addUnitHead(){
    const headers = new HttpHeaders({
      'Authorization' : `Bearer ${this.token}`
    })
    return this.httpClient.post(this.usersEndpoint , {headers})
  }
  constructor() { }
}
