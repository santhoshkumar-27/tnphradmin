import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HabitationMaster } from 'src/app/models/master-habitation';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { getHeaders } from 'src/app/utils/api-request.util';
import { environment } from 'src/environments/environment';
import { Facility } from 'src/app/models/facility';
import { Constants } from 'src/app/config/constants/constants'

@Injectable()
export class FacilityService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  getFacilities(
    user: User,
    filters: any,
    pageIndex: number = 0,
    pageSize: number
  ): Observable<Facility[]> {
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      GOVT_DEPARTMENT: Constants.GOVT_DEPT_HEALTH,
      FILTERS: filters,
      LIMIT: pageSize,
      OFFSET: pageIndex * pageSize,
    };
    return this._http.post<Facility[]>(
      `admin_api_get_facility_list`,
      request
    );
  }

  upsertFacility(user: User, facility: Facility): Observable<string> {
    let response: Subject<string> = new Subject();

    // remove un-nessary attributes form request object
    delete facility.street_name;
    delete facility.date_created;
    delete facility.last_update_date;
    // For health facility 'govt_department' should be set to 'Health'
    facility.govt_department = Constants.GOVT_DEPT_HEALTH;

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FACILITY_DATA: facility,
    };

    this._http
      .post<any>(`admin_api_upsert_facility`, request)
      .subscribe((value) => {
        response.next(value.status);
      });
    return response;
  }

  getDirectorates(
    ownerId: string,
    currentUserDirectorateId: string,
    currentUserDirectorateName?: string
  ) {
    console.log('Facility service | Getting directorates for owner:', ownerId);
    if (currentUserDirectorateName == 'NHM') {
      return this._dataService.db.directorates
        .where('owner_id')
        .equals(ownerId)
        .toArray();
    } else {
      return this._dataService.db.directorates
        .where({
          owner_id: ownerId,
          directorate_id: currentUserDirectorateId,
        })
        .toArray();
    }
  }

  getCategories(ownerId: any, directorateId: any) {
    console.log(
      'Facility service | Getting directorates for owner:',
      ownerId,
      ' and directorate:',
      directorateId
    );
    return this._dataService.db.categories
      .where({ owner_id: ownerId, directorate_id: directorateId })
      .toArray();
  }

  getFacilityTypes(ownerId: any, directorateId: any, categoryId: any) {
    console.log(
      'Facility service | Getting Facility types for owner:',
      ownerId,
      ', directorate:',
      directorateId,
      ', categoryId:',
      categoryId
    );
    return this._dataService.db.facilityTypes
      .where({
        owner_id: ownerId,
        directorate_id: directorateId,
        category_id: categoryId,
      })
      .toArray();
  }

  getFacilityLevels(
    ownerId: any,
    directorateId: any,
    categoryId: any,
    facilityTypeId: any
  ) {
    console.log(
      'Facility service | Getting Facility levels for owner:',
      ownerId,
      ', directorate:',
      directorateId,
      ', categoryId:',
      categoryId,
      ', facilityTypeId:',
      facilityTypeId
    );
    return this._dataService.db.facilityLevels
      .where({
        owner_id: ownerId,
        directorate_id: directorateId,
        category_id: categoryId,
        facility_type_id: facilityTypeId,
      })
      .toArray();
  }

  async getParentFacilities(
    ownerId: any,
    directorateId: any,
    categoryId: any,
    facilityTypeId: any,
    levelId: string,
    levelName: string,
    directorateName: string,
    facilityTypeName: string
  ) {
    console.log(
      'Facility service | Getting Parent facility for owner:',
      ownerId,
      ', directorate:',
      directorateId,
      ', categoryId:',
      categoryId,
      ', facilityTypeId:',
      facilityTypeId,
      ', levelId:',
      levelId,
      ', levelName:',
      levelName,
      ', facilityTypeName:',
      facilityTypeName
    );
    let filteredFacilities: any;
    if (levelName === 'State') {
      // Parent facility of state level should be a state level facility
      filteredFacilities = this._dataService.db.facilities.where({
        directorate_id: directorateId,
        facility_level: 'State',
      });
    } else if (levelName === 'Regional') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          owner_id: ownerId,
          directorate_id: directorateId,
          //category_id: categoryId,
          //facility_type_id: facilityTypeId,
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'Regional' ||
            facility.facility_level === 'State'
        );
    } else if (levelName === 'District') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          owner_id: ownerId,
          directorate_id: directorateId,
          //category_id: categoryId,
          //facility_type_id: facilityTypeId,
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'District' ||
            facility.facility_level === 'Regional' ||
            facility.facility_level === 'State'
        );
    } else if (levelName === 'HUD') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          owner_id: ownerId,
          directorate_id: directorateId,
          //category_id: categoryId,
          //facility_type_id: facilityTypeId,
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'HUD' ||
            facility.facility_level === 'District' ||
            facility.facility_level === 'Regional' ||
            facility.facility_level === 'State'
        );
    } else if (levelName === 'Block') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          owner_id: ownerId,
          directorate_id: directorateId,
          //category_id: categoryId,
          //facility_type_id: facilityTypeId,
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'Block' ||
            facility.facility_level === 'District' ||
            facility.facility_level === 'HUD'
        );
    } else if (levelName === 'HSC') {
      filteredFacilities = this._dataService.db.facilities.where({
        owner_id: ownerId,
        directorate_id: directorateId,
        //category_id: categoryId,
        //facility_type_id: facilityTypeId,
        facility_level: 'PHC',
      });
    } else if (levelName === 'PHC') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          owner_id: ownerId,
          directorate_id: directorateId,
          //category_id: categoryId,
          //facility_type_id: facilityTypeId,
          //facility_level: 'Block',
        })
        .filter((facility: any) =>
          facilityTypeName == 'Polyclinic'
            ? facility.facility_level === 'PHC'
            : facility.facility_level === 'Block'
        );
    } else {
      console.log('Invalid levelName:', levelName);
      return [];
    }

    // Find NHM facilities and include to filtered facilities.
    let nhmFacilities = this.nhmFacilityQuery(levelName, directorateName);

    console.log('---- Select directorate name:', directorateName);
    if (directorateName === 'NHM') {
      const [allFilteredFacilities] = await Promise.all([
        filteredFacilities.toArray(),
      ]);

      console.log('If cond:', allFilteredFacilities);

      return [...allFilteredFacilities];
    } else {
      const [allFilteredFacilities, allNhmFacilities] = await Promise.all([
        filteredFacilities.toArray(),
        nhmFacilities.toArray(),
      ]);

      console.log('If cond 1:', [...allFilteredFacilities]);
      console.log('If cond 2:', [...allNhmFacilities]);
      return [...allFilteredFacilities, ...allNhmFacilities];
    }
  }

  // This return dexie collection
  nhmFacilityQuery(levelName: string, directorateName: string) {
    let filteredFacilities: any;
    if (levelName === 'State') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          facility_level: 'State',
          // remove the facilities with selected directorate (already fetched above in state level)
        })
        .filter(
          (facility: any) => facility.directorate_name !== directorateName
        );
    } else if (levelName === 'Regional') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          directorate_name: 'NHM',
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'Regional' ||
            facility.facility_level === 'State'
        );
    } else if (levelName === 'District') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          directorate_name: 'NHM',
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'District' ||
            facility.facility_level === 'Regional' ||
            facility.facility_level === 'State'
        );
    } else if (levelName === 'HUD') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          directorate_name: 'NHM',
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'HUD' ||
            facility.facility_level === 'District' ||
            facility.facility_level === 'Regional' ||
            facility.facility_level === 'State'
        );
    } else if (levelName === 'Block') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          directorate_name: 'NHM',
        })
        .filter(
          (facility: any) =>
            facility.facility_level === 'Block' ||
            facility.facility_level === 'District' ||
            facility.facility_level === 'HUD'
        );
    } else if (levelName === 'HSC') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          directorate_name: 'NHM',
        })
        .filter((facility: any) => facility.facility_level === 'PHC');
    } else if (levelName === 'PHC') {
      filteredFacilities = this._dataService.db.facilities
        .where({
          directorate_name: 'NHM',
        })
        .filter((facility: any) => facility.facility_level === 'Block');
    } else {
      console.log('Invalid NHM levelName:', levelName);
      return [];
    }

    return filteredFacilities;
  }

  async getBlocksListForDistrict(district_id: any) {
    console.log('Facility service | getting blocks for district:', district_id);
    return await this._dataService.db.blocks
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getHudListForDistrict(district_id: any) {
    console.log('facility service | getting huds for district:', district_id);
    return await this._dataService.db.huds
      .where('district_id')
      .equals(district_id)
      .toArray();
  }

  async getBlocksList() {
    return await this._dataService.db.blocks.toArray();
  }

  async getHudList() {
    return await this._dataService.db.huds.toArray();
  }

  getOwners(user: User, village_id: string): Observable<HabitationMaster[]> {
    console.log(
      'Facility service | getting habitaions for village:',
      village_id
    );
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: {
        VILLAGE_ID: village_id,
      },
    };
    return this._http
      .post<any>(`admin_api_get_owner_list`, request)
      .pipe(map((response) => (response.data ? response.data : [])));
  }

  getStreets(user: User, village_id: string): Observable<HabitationMaster[]> {
    console.log('Facility service | getting streets for village:', village_id);
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: {
        VILLAGE_ID: village_id,
      },
    };
    return this._http
      .post<any>(`admin_api_get_street_master`, request)
      .pipe(map((response) => (response.data ? response.data : [])));
  }

  getCategory(block_id: string): Promise<any> {
    // return this._dataService.db.facilities.get({block_id: block_id});
    return this._dataService.db.villages
      .where('block_id')
      .equals(block_id)
      .toArray();
  }

  getDistrictName(districtId: string): Promise<string> {
    return this._dataService.db.districts.get(districtId).then((value: any) => {
      return value?.district_name;
    });
  }

  getBlockName(blockId: string): Promise<string> {
    return this._dataService.db.blocks.get(blockId).then((value: any) => {
      return value?.block_name;
    });
  }

  getFacilityName(facilityId: string): Promise<string> {
    return this._dataService.db.facilities
      .get(facilityId)
      .then((value: any) => {
        return value?.facility_name;
      });
  }

  getOwnerName(ownerId: string): Promise<string> {
    return this._dataService.db.owners.get(ownerId).then((value: any) => {
      return value?.owner_name;
    });
  }

  getDirectorateName(directorateId: string): Promise<string> {
    return this._dataService.db.directorates
      .get(directorateId)
      .then((value: any) => {
        return value?.directorate_name;
      });
  }

  getCategoryName(categoryId: string): Promise<string> {
    return this._dataService.db.categories
      .get(categoryId)
      .then((value: any) => {
        return value?.category_name;
      });
  }

  getTypeName(typeId: string): Promise<string> {
    return this._dataService.db.facilityTypes.get(typeId).then((value: any) => {
      return value?.facility_type_name;
    });
  }

  getLevelName(levelId: string): Promise<string> {
    return this._dataService.db.facilityLevels
      .get(levelId)
      .then((value: any) => {
        return value?.facility_level_name;
      });
  }

  addFacilityToLocalDb(facility: Facility) {
    console.log('Added facility to local cahe.', facility);
    this._dataService.db.facilities
      .put(facility)
      .then((result: any) =>
        console.log('Added facility to local cache:', result)
      )
      .catch((error: any) => console.log('Error while inserting:', error));
  }

  async getHudName(hudId: string): Promise<string> {
    return await this._dataService.db.huds.get(hudId).then((value: any) => {
      return value?.hud_name;
    });
  }

  bulkEdit(
    user: User,
    facility_data: any,
    facility_ids: any
  ): Observable<string> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FACILITY_DATA: facility_data,
      FACILITY_IDS: facility_ids,
    };

    this._http
      .post<any>(`admin_api_bulk_facility_update`, request)
      .subscribe((value) => {
        response.next(value.status);
      });
    return response;
  }

  async getBlocksListForHud(hud_id: any) {
    return await this._dataService.db.blocks.where("hud_id").equals(hud_id).toArray();
  }
}
