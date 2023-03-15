import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user';
import { getHeaders } from '../utils/api-request.util';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  baseUrl: string = environment.serviceApiBaseUrl;

  constructor(private _http: HttpClient) {}

  validateGID(
    user: User,
    _id: string,
    _gid: number,
    type: string
  ): Observable<any> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      [type]: {
        [`${type?.toLowerCase()}_gid`]: _gid,
        [`${type?.toLowerCase()}_id`]: _id,
      },
    };
    return this._http.post<any>(
      `admin_api_validate_gid`,
      request
    );
  }
}
