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

  
}
