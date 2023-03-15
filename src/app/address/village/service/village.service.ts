import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from 'src/app/config/constants/constants';
import { Village } from 'src/app/models/village';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';

@Injectable()
export class VillageService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  async getHudListForDistrict(district_id: any) {
    console.log('Village service | getting huds for district:', district_id);
    return await this._dataService.db.huds
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getBlocksListForDistrict(district_id: any) {
    console.log('Village service | getting block for district:', district_id);
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

  async getBlocksByGID(gid: any) {
    console.log('Village service | getting villages for gid:', gid);
    return await this._dataService.db.villages
      .where('village_gid')
      .equals(gid)
      .toArray();
  }

  async getHudList() {
    console.log('Village service | getting huds');
    return await this._dataService.db.huds.toArray();
  }

  async getBlocksList() {
    console.log('Village service | getting blocks');
    return await this._dataService.db.blocks.toArray();
  }

  getVillages(
    user: User,
    filters: any,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<Village[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<Village[]>(
      `admin_api_get_village_list`,
      request,
    );
  }

  upsertVillage(
    user: User,
    village: Village,
    target_hsc: string | null
  ): Observable<string> {
    let response: Subject<string> = new Subject();

    // remove un-nessary attributes form request object
    delete village.district_name;
    delete village.hud_name;
    delete village.block_name;

    let request: any = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      VILLAGE_DATA: village,
    };

    if (target_hsc != null) request.TARGET_HSC = target_hsc;

    this._http
      .post<any>(`${this.baseUrl}/admin_api_upsert_village`, request, {
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

  addVillageToLocalDb(village: Village) {
    console.log('Added village to local cahe.', village);
    this._dataService.db.villages
      .put(village)
      .then((result: any) =>
        console.log('Added village to local cache:', result)
      )
      .catch((error: any) => console.log('Error while inserting:', error));
  }
}
