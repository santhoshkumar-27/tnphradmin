import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Subject } from 'rxjs/internal/Subject';
import { Constants } from 'src/app/config/constants/constants';
import { HABITATION } from 'src/app/models/habitation';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HabitationService {
  baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  getHabitations(
    user: User,
    filters: any,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<HABITATION[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<HABITATION[]>(
      `admin_api_get_hab_list`,
      request,
    );
  }

  async getHudList() {
    return await this._dataService.db.huds.toArray();
  }

  async getHudListForDistrict(district_id: any) {
    return await this._dataService.db.huds
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getBlockList() {
    return await this._dataService.db.blocks.toArray();
  }

  async getBlockListForDistrict(district_id: any) {
    return await this._dataService.db.blocks
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getBlocksListForHud(hud_id: any) {
    return await this._dataService.db.blocks
      .where('hud_id')
      .equals(hud_id)
      .toArray();
  }

  async getVillageList() {
    return await this._dataService.db.villages.toArray();
  }

  async getVillageListForBlock(blockId: string) {
    return await this._dataService.db.villages
      .where('block_id')
      .equals(blockId)
      .toArray();
  }

  upsertHabitation(user: User, habitation: HABITATION, target_hsc: string | null): Observable<string> {
    let response: Subject<string> = new Subject();

    let request:any = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      HABITATION_DATA: habitation,
    };

    if (target_hsc != null) request.TARGET_HSC = target_hsc;

    this._http
      .post<any>(`admin_api_upsert_hab`, request)
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

  addHabitationToLocalDb(hab: HABITATION) {
    this._dataService.db.habitations
      .put(hab)
      .then((result: any) =>
        console.log('Added habitation to local cache:', result)
      )
      .catch((error: any) => console.log('Error while inserting:', error));
  }
}
