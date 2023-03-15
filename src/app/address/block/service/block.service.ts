import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from 'src/app/config/constants/constants';
import { Block } from 'src/app/models/block';
import { Facility } from 'src/app/models/facility';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';

@Injectable()
export class BlockService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  async getHudListForDistrict(district_id: any) {
    console.log('Block service | getting huds for district:', district_id);
    return await this._dataService.db.huds
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getBlocksListForDistrict(district_id: any) {
    console.log('Block service | getting blocks for district:', district_id);
    return await this._dataService.db.blocks
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getBlocksByGID(gid: any) {
    console.log('Block service | getting blocks for gid:', gid);
    return await this._dataService.db.blocks
      .where('block_gid')
      .equals(gid)
      .toArray();
  }

  async getHudList() {
    console.log('Block service | getting huds');
    return await this._dataService.db.huds.toArray();
  }

  async getBlocksList() {
    console.log('Block service | getting blocks');
    return await this._dataService.db.blocks.toArray();
  }

  getBlocks(
    user: User,
    filters: any,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<Block[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<Block[]>(
      `admin_api_get_block_list`,
      request
    );
  }

  upsertBlock(user: User, block: Block): Observable<string> {
    let response: Subject<string> = new Subject();

    // remove un-nessary attributes form request object
    delete block.district_name;
    delete block.hud_name;

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      BLOCK_DATA: block,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_upsert_block`, request, {
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

  addBlockToLocalDb(block: Block) {
    console.log('Added block to local cahe.', block);
    this._dataService.db.blocks
      .put(block)
      .then((result: any) => console.log('Added block to local cache:', result))
      .catch((error: any) => console.log('Error while inserting:', error));
  }

  getMainPhcs(
    user: User,
    district_id: string,
    hud_id: string
  ): Observable<Facility[]> {
    let mainPhcs:Subject<Facility[]> = new Subject();
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
        DISTRICT_ID: district_id,
        BLOCK_ID: null,
        INSTITUTION_GID: null,
      },
      LIMIT: 5000,
      OFFSET: 0,
    };
    this._http
      .post<Facility[]>(
        `admin_api_get_facility_list`,
        request
      )
      .subscribe((res: any) => {
        console.log("total facilitites", res.data)
        let phcs = res?.data?.filter(phc => phc.hud_id == hud_id && phc.facility_level ==  'PHC') || [];
        console.log("after filtering", phcs)
        mainPhcs.next(phcs);
      });
    return mainPhcs;
  }
}