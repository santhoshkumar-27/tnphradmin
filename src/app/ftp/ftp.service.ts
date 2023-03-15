import { Injectable } from '@angular/core';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { User } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { getHeaders } from '../utils/api-request.util';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { FTP_MAPPING } from '../models/ftp-mapping';
import { map } from 'rxjs/operators';
import { FacilityService } from '../facility/facility/service/facility.service';

@Injectable({
  providedIn: 'root',
})
export class FtpService {
  baseUrl: string = environment.serviceApiBaseUrl;
  constructor(
    private _dataService: DataStoreService,
    private http: HttpClient,
    private _facilityService: FacilityService
  ) {}

  getBlocksListForDistrict(district_id: string) {
    console.log('ftp service | getting blocks for district:', district_id);
    return this._dataService.db.blocks
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  getPhcsForBlock(block_id: string) {
    console.log('ftp service | getting phcs for block:', block_id);
    return this._dataService.db.facilities
      .where({ block_id: block_id, facility_level: 'PHC' })
      .toArray();
  }

  getHscsForBlock(block_id: string) {
    console.log('ftp service | getting hscs for block:', block_id);
    return this._dataService.db.facilities
      .where({ block_id: block_id, facility_level: 'HSC' })
      .toArray();
  }

  async getHscsForPhc(facility_id: string) {
    console.log('ftp service | getting hscs for phc:', facility_id);
    return await this._dataService.db.facilities
      .where({ facility_level: 'HSC', parent_facility: facility_id })
      .toArray();
  }

  getFtpMappings(user: User, hscFacilityId: string): Observable<FTP_MAPPING> {
    const request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      HSC_FACILITY_ID: hscFacilityId,
    };
    return this.http
      .post(
        `admin_api_get_ftp_street_details`,
        request
      )
      .pipe(map((response: any) => (response.data ? response.data : [])));
  }

  saveFtpMappings(user: User, ftpMappings: any, hscFacilityId: string) {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      HSC_FACILITY_ID: hscFacilityId,
      STREET_FTP_MAPPINGS: ftpMappings,
    };
    return this.http.post(
      `admin_api_upsert_ftp_street_details`,
      request
    );
  }

  getFacilitiesForStateAdmin(user: User, blockId: string) {
    const filters = {
      OWNER_ID: null,
      DIRECTORATE_ID: null,
      CATEGORY_ID: null,
      FACILITY_TYPE_ID: null,
      FACILITY_LEVEL_ID: null,
      FACILITY_NAME: null,
      DISTRICT_ID: null,
      BLOCK_ID: blockId,
      INSTITUTION_GID: null,
    };
    return this._facilityService.getFacilities(user, filters, 0, 5000);
  }

  getPhcList(facilities: any) {
    return facilities.filter(
      (facility: any) => facility.facility_level == 'PHC'
    );
  }

  getHscList(facilities: any) {
    return facilities.filter(
      (facility: any) => facility.facility_level == 'HSC'
    );
  }
}
