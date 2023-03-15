import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from 'src/app/models/user';
import { getHeaders } from 'src/app/utils/api-request.util';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ValidationApiService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(private _http: HttpClient) {}

  getUserWithMobileNumber(mobile_number: string, user: User): Observable<any> {
    const request = {
        MOBILE_NUMBER: mobile_number
    }

    console.log('Invoking api.');
    return this._http
    .post<any>(`admin_api_get_user_by_mobile`, request);
  }
}
