import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { Endpoints } from '../../shared/endpoints.model';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BasicAuthService {

  constructor(private http: HttpClient) { }

getPublicIpAddress(): Observable<string> {
  return this.http.get<{ip: string}>('https://api.ipify.org?format=json').pipe(
    tap(res => console.log('Fetched IP:', res.ip)),
    map(res => res.ip),
    catchError(() => of('unknown'))
  );
}
 login(data: { email: string, password: string }): Observable<any> {
  return this.getPublicIpAddress().pipe(
    switchMap(ip => {
      const deviceId = localStorage.getItem('deviceId') || 'default-device-id';
      const deviceType = this.getDeviceType();

      const headers = new HttpHeaders()
        .set('UserAgent', navigator.userAgent)
        .set('IpAddress', ip)
        .set('DeviceId', deviceId)
        .set('X-Forwarded-For', ip) 
        .set('X-Device-Type', deviceType)
        .set('Content-Type', 'application/json');

      const endpoint = Endpoints.LoginBasicAuth;

      return this.http.post(endpoint, data, { headers }).pipe(
        tap(() => {
          console.log("Login successful");
        }),
        catchError(error => {
          console.error("Login error:", error);
          return throwError(() => error);
        })
      );
    })
  );
}

logOut(refreshToken:any){
  const authToken = localStorage.getItem('authtoken')
  const endPoint = Endpoints.logout;
  const headers = new HttpHeaders({
    'Authorization':`Bearer ${authToken}`
  })
  return this.http.post(endPoint,refreshToken,{headers})
}

getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}
}