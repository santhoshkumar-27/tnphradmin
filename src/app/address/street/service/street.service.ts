import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Facility } from 'src/app/models/facility';
import { HabitationMaster } from 'src/app/models/master-habitation';
import { VillageMaster } from 'src/app/models/master_village';
import { Street } from 'src/app/models/street';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';
import { Constants } from 'src/app/config/constants/constants'

@Injectable()
export class StreetService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(private _http: HttpClient, private _dataService: DataStoreService) {}

  upsertStreet(user: User, street: Street): Observable<string> {
    let response: Subject<string> = new Subject();

    // remove un-nessary attributes form request object
    delete street.block_name;
    delete street.village_name;
    delete street.rev_village_name;
    delete street.habitation_name;
    delete street.facility_name;
    delete street.district_name;
    delete street.hud_name;
    delete street.catering_anganwadi_name;
    // HSC unit id will be populated in API side using unit_name
    delete street.hsc_unit_id;
    delete street.date_created;
    delete street.last_update_date;
    
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      STREET_DATA: street,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_upsert_street`, request, {
        headers: getHeaders(user.auth_token),
      })
      .subscribe((value) => {
        response.next(value.status);
      });
    return response;
  }

  getStreets(
    user: User,
    filters: any,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<Street[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<Street[]>(
      `admin_api_get_street_list`,
      request
    );
  }

  getHabitations(user: User, village_id: string): Observable<HabitationMaster[]> {
    console.log('Street service | getting habitaions for village:', village_id);
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: {
        VILLAGE_ID: village_id,
      },
    };
    return this._http.post<any>(
      `${this.baseUrl}/admin_api_get_habitation_master`,
      request,
      { headers: getHeaders(user.auth_token) }
    ).pipe(
      map((response) => response.data ? response.data : [])
    );
  }

  getVillages(block_id: string): Promise<any> {
    console.log('Street Service | Retreiving villages for block id:', block_id);
    return this._dataService.db.villages.where("block_id").equals(block_id).toArray();
  }

  async getBlockFacilities(block_id: string): Promise<any> {
    console.log('Street Service | Retreiving facilities for block id:', block_id);
    return await this._dataService.db.facilities.where({block_id: block_id, facility_level: 'HSC'}).toArray();
  }

  async getDistrictFacilities(district_id: string): Promise<any> {
    console.log('Street Service | Retreiving facilities');
    return await this._dataService.db.facilities.where({district_id: district_id, facility_level: 'HSC'}).toArray();
  }

  async getHudListForDistrict(district_id: any) {
    console.log('Street service | getting huds for district:', district_id);
    return await this._dataService.db.huds.where("district_id").equals(district_id).toArray();
  }

  async getBlocksListForDistrict(district_id: any) {
    console.log('Facility service | getting blocks for district:', district_id);
    return await this._dataService.db.blocks.where("district_id").equals(district_id).toArray();
  }

  getHSCFacilities(
    user: User, block_id: string
  ): Observable<Facility[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      GOVT_DEPARTMENT: Constants.GOVT_DEPT_HEALTH,
      FILTERS: {
        "OWNER_ID": null,
        "DIRECTORATE_ID": null,
        "CATEGORY_ID": null,
        "FACILITY_TYPE_ID": null,
        "FACILITY_LEVEL_ID": null,
        "FACILITY_NAME": null,
        "DISTRICT_ID": null,
        "BLOCK_ID": block_id,
        "INSTITUTION_GID": null
      },
      LIMIT: 500,
      OFFSET: 0,
    };
    return this._http.post<Facility[]>(
      `admin_api_get_facility_list`,
      request
    );
  }

  getAnganwadis(
    user: User, block_id: string
  ): Observable<Facility[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      GOVT_DEPARTMENT: Constants.GOVT_DEPT_ICDS,
      FILTERS: {
        "OWNER_ID": null,
        "DIRECTORATE_ID": null,
        "CATEGORY_ID": null,
        "FACILITY_TYPE_ID": null,
        "FACILITY_LEVEL_ID": null,
        "FACILITY_NAME": null,
        "DISTRICT_ID": null,
        "BLOCK_ID": block_id,
        "INSTITUTION_GID": null
      },
      LIMIT: 1000,
      OFFSET: 0,
    };
    return this._http.post<Facility[]>(
      `admin_api_get_facility_list`,
      request
    );
  }

  // getBlockListForHud(district_id: any) {
  //   console.log('Street service | getting huds for district:', district_id);
  //   return this._dataService.db.huds.where("district_id").equals(district_id).toArray();
  // }

  async getHudList() {
    console.log('Street service | getting huds');
    return await this._dataService.db.huds.toArray();
  }

  async getBlocksList() {
    console.log('Facility service | getting blocks');
    return await this._dataService.db.blocks.toArray();
  }


  bulkUpdateStreets(user: User, street: any, street_ids: any, ward_data: any): Observable<string> {
    let response: Subject<string> = new Subject();
    
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      STREET_DATA: street,
      STREET_IDS: street_ids,
      WARD_DATA: ward_data,
    };

    this._http
      .post<any>(`${this.baseUrl}/admin_api_bulk_street_update`, request, {
        headers: getHeaders(user.auth_token),
      })
      .subscribe((value) => {
        response.next(value.status);
      });
    return response;
  }

  async getBlocksListForHud(hud_id: any) {
    return await this._dataService.db.blocks.where("hud_id").equals(hud_id).toArray();
  }
}
