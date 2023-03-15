import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import {
  RevenueVillage,
  RevenueVillageFilters,
} from 'src/app/models/revenue-village';
import { User } from 'src/app/models/user';
import { environment } from 'src/environments/environment';
import { getHeaders } from 'src/app/utils/api-request.util';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { Subject } from 'rxjs/internal/Subject';
import { Constants } from 'src/app/config/constants/constants';
import { TalukMaster } from 'src/app/models/master_taluk';

@Injectable({
  providedIn: 'root',
})
export class RevenueVillageService {
  baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  getRevenueVillages(
    user: User,
    filters: RevenueVillageFilters,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<RevenueVillage[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<RevenueVillage[]>(
      `admin_api_get_rev_village_list`,
      request
    );
  }

  async getTalukList() {
    return await this._dataService.db.taluks.toArray();
  }

  async getTalukListperDistrict(districtId: string) {
    let taluks = await this._dataService.db.taluks.toArray();
    let temp = taluks[0]?.district_id;
    if (temp && typeof temp == 'object') {
      return taluks.filter(
        (taluk: TalukMaster) => taluk?.district_id!.indexOf(districtId) >= 0
      );
    } else {
      return await this._dataService.db.taluks
        .where('district_id')
        .equals(districtId)
        .toArray();
    }
    // need to modify the code once taluk master api response updated
  }

  upsertRevVillage(user: User, revVillage: RevenueVillage): Observable<any> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      REV_VILLAGE_DATA: revVillage,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_upsert_rev_village`, request, {
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

  addRevVillageToLocalDb(revVillage: RevenueVillage) {
    this._dataService.db.revVillages
      .put(revVillage)
      .then((result: any) =>
        console.log('Added rev village to local cache:', result)
      )
      .catch((error: any) => console.log('Error while inserting:', error));
  }
}
