import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { Constants } from "src/app/config/constants/constants";
import { District } from "src/app/models/district";
import { User } from "src/app/models/user";
import { DataStoreService } from "src/app/starter/services/datastore.service";
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';

@Injectable()
export class DistrictService {
    private baseUrl = environment.serviceApiBaseUrl;

    constructor(private _http: HttpClient, private _dataService: DataStoreService) {}
    
    getDistricts(
        user: User,
        filters: any,
        pageIndex: number = 0,
        pageSize: number
     ): Observable<District[]> {
        let request = {
          USER_ID: user.user_id,
          USER_PHR_ROLE: user.phr_role,
          USER_FACILITY_ID: user.facility_id,
          FILTERS: filters,
          LIMIT: pageSize,
          OFFSET: pageIndex * pageSize,
        };
        return this._http.post<District[]>(
          `admin_api_get_district_list`,
          request
        );
    }

    upsertDistrict(user: User, district: District): Observable<string> {
      let response: Subject<string> = new Subject();

      delete district.state_name;
      
      let request = {
        USER_ID: user.user_id,
        USER_PHR_ROLE: user.phr_role,
        USER_FACILITY_ID: user.facility_id,
        DISTRICT_DATA: district,
      };
  
      this._http
        .post<any>(`admin_api_upsert_district`, request)
        .subscribe((value) => {
          response.next(value.status);
        }, (error) => {
          response.next(Constants.FAILURE_FLAG);
        });
      return response;
  }

    addDistrictToLocalDb(district: District) {
      console.log('Added district to local cache.', district);
      this._dataService.db.districts
        .put(district)
        .then((result: any) =>
          console.log('Added district to local cache:', result)
        )
        .catch((error: any) => console.log('Error while inserting:', error));
    }
}
