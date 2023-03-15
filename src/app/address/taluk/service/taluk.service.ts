import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { Constants } from "src/app/config/constants/constants";
import { Taluk } from "src/app/models/taluk";
import { User } from "src/app/models/user";
import { DataStoreService } from "src/app/starter/services/datastore.service";
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';

@Injectable()
export class TalukService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  getTaluks(
    user: User,
    filters: any,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<Taluk[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<Taluk[]>(
      `admin_api_get_taluk_list`,
      request,
    ).pipe(
      // need to remove this when taluk is updated with correct format
      map((response: any) => {
        console.log(response.data,"in map")
        if (filters?.DISTRICT_ID) {
          response?.data?.forEach((el: any) => {
            el.district_id = [filters?.DISTRICT_ID];
          });
        }
        console.log(response.data,"in map")
        return response;
      })
      // end
    )
  }

  upsertTaluk(user: User, taluk: Taluk): Observable<string> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      TALUK_DATA: taluk,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_upsert_taluk`, request, {
        headers: getHeaders(user.auth_token),
      })
      .subscribe(
        (value) => {
          response.next(value.status);
        },
        (error) => {
          response.next(Constants.FAILURE_FLAG);
        }
      );
    return response;
  }

  addTalukToLocalDb(taluk: Taluk) {
    console.log('Added Taluk to local cache.', taluk);
    this._dataService.db.taluks
      .put(taluk)
      .then((result: any) => console.log('Added taluk to local cache:', result))
      .catch((error: any) => console.log('Error while inserting:', error));
  }
}