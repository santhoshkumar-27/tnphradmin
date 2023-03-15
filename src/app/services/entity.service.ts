import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Constants } from '../config/constants/constants';
import { Facility } from '../models/facility';
import { User } from '../models/user';
import { getHeaders } from '../utils/api-request.util';

@Injectable({
  providedIn: 'root',
})
export class EntityService {
  baseUrl: string = environment.serviceApiBaseUrl;

  constructor(private _http: HttpClient) {}

  getHSCFacilities(user: User, block_id: string): Observable<Facility[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      GOVT_DEPARTMENT: Constants.GOVT_DEPT_HEALTH,
      FILTERS: {
        OWNER_ID: null,
        DIRECTORATE_ID: null,
        CATEGORY_ID: null,
        FACILITY_TYPE_ID: null,
        FACILITY_LEVEL_ID: null,
        FACILITY_NAME: null,
        DISTRICT_ID: null,
        BLOCK_ID: block_id,
        INSTITUTION_GID: null,
      },
      LIMIT: 500,
      OFFSET: 0,
    };
    return this._http.post<Facility[]>(
      `admin_api_get_facility_list`,
      request
    );
  }

  getLowerEntities(user: User, payload: any): Observable<any> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      ...payload,
    };
    return this._http.post<any>(
      `admin_api_pre_upsert`,
      request
    );
  }
}
