import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _router: Router,
    private _dataService: DataStoreService
  ) {}

  upsertUser(user: User, employee: User): Observable<string> {
    let response: Subject<string> = new Subject();

    delete employee.facility_name;
    delete employee.district_id;
    delete employee.block_id;
    delete employee.hud_id;
    delete employee.department_name;
    delete employee.date_created;
    delete employee.last_update_date;

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      USER_DATA: employee,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_upsert_user`, request, {
        headers: this.getHeaders(user.auth_token),
      })
      .subscribe((value) => {
        response.next(value.status);
      });
    return response;
  }

  getUsers(
    user: User,
    filters: any = null,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<User[]> {
    console.log('Inside get Users:', filters);
    let _filters: any = null;
    if (!filters) {
      _filters = {
        USER_NAME: null,
        MOBILE_NUMBER: null,
        DISTRICT_ID: null,
        BLOCK_ID: null,
        PHR_ROLE: null,
        FACILITY_ID: null,
        ROLE: null,
      };
    } else {
      _filters = filters;
    }

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
      FILTERS: _filters,
    };

    console.log('Calling get user list with req:', request);
    return this._http.post<any>(
      `admin_api_get_user_list`,
      request
    );
  }

  getHeaders(token: string | null): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-access-token': token ? token : '',
    });

    return headers;
  }

  getBlocksListForDistrict(district_id: any) {
    console.log('list user | getting blocks for district:', district_id);
    return this._dataService.db.blocks
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  getFacilityNameForBlock(block_id: any) {
    console.log('list user | getting facility for block:', block_id);
    return this._dataService.db.facilities
      .where('block_id')
      .equals(block_id)
      .toArray();
  }

  getBlockId(facilityId: string): Promise<string> {
    return this._dataService.db.facilities
      .get(facilityId)
      .then((value: any) => {
        return value?.block_id;
      });
  }

  getRoleName(roleId: string): Promise<string> {
    return this._dataService.db.employeeRoles.get(roleId).then((value: any) => {
      return value?.role_name;
    });
  }

  async getHudName(hudId: string) {
    return await this._dataService.db.huds.get(hudId).then((value: any) => {
      return value?.hud_name;
    });
  }

  bulkEdit(user: User, user_data: any, user_ids: any): Observable<string> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      USER_DATA: user_data,
      USER_IDS: user_ids,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_bulk_user_update`, request, {
        headers: this.getHeaders(user.auth_token),
      })
      .subscribe((value) => {
        response.next(value.status);
      });
    return response;
  }
}
