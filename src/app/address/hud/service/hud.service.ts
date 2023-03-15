import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { Constants } from 'src/app/config/constants/constants';
import { HUD, HUD_FILTERS } from 'src/app/models/hud';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HudService {
  baseUrl: string = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  getHuds(
    user: User,
    filters: HUD_FILTERS,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<HUD[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<HUD[]>(
      `admin_api_get_hud_list`,
      request
    );
  }

  upsertHud(user: User, hud: HUD): Observable<string> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      HUD_DATA: hud,
    };

    this._http
      .post<any>(`admin_api_upsert_hud`, request)
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

  addHudToLocalDb(hud: HUD) {
    this._dataService.db.huds
      .put(hud)
      .then((result: any) =>
        console.log('Added hud to local cache:', result)
      )
      .catch((error: any) => console.log('Error while inserting:', error));
  }

}
