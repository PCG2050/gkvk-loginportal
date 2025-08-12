import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Endpoints } from '../../shared/endpoints.model';
import { Observable } from 'rxjs';
import { State } from '../models/states.model';
import { Districts } from '../models/districts.models';

@Injectable({
  providedIn: 'root'
})
export class LocationsService {
   private httpClient = inject(HttpClient);
  private baseUrl = `${Endpoints.getbaseURL()}/api/Locations/states`;
  getStates():Observable<State[]>{
    let endPoint = Endpoints.states;
   return this.httpClient.get<State[]>(`${endPoint}`);
  }
  getDistricts(stateId:number):Observable<Districts[]>{
    let endPoint = Endpoints.districts
    return this.httpClient.get<Districts[]>(`${this.baseUrl}/${stateId}/districts`)
  }
  constructor() { }
}
