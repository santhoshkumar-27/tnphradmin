import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from 'src/app/config/constants/constants';
import { ClinicMaster } from 'src/app/models/master-clinic';
import { ClinicTypeMaster } from 'src/app/models/master-clinic-type';
import { DepartmentMaster } from 'src/app/models/master-department';
import { BlockMaster } from 'src/app/models/master_block';
import { DistrictMaster } from 'src/app/models/master_district';
import { RevVillageMaster, VillageMaster } from 'src/app/models/master_village';
import { User } from 'src/app/models/user';
import { EmployeeRoleMaster, EmployeeDesignationMaster} from 'src/app/models/master-employee';
import { getHeaders } from 'src/app/utils/api-request.util';

import { environment } from 'src/environments/environment';
import { DataStoreService } from './datastore.service';
import { HabitationMaster } from 'src/app/models/master-habitation';
import { OwnerMaster } from 'src/app/models/master-owner';
import { DirectorateMaster } from 'src/app/models/master-directorate';
import { CategoryMaster } from 'src/app/models/category-master';
import { FacilityTypeMaster } from 'src/app/models/facility-type-master';
import { FacilityLevelMaster } from 'src/app/models/facility-level-master';
import { HudMaster } from 'src/app/models/master-hud';
import { AssemblyConstituency } from 'src/app/models/assembly-constituency';
import { ParliamentConstituency } from 'src/app/models/parliament-constituency';
import { StateMaster } from 'src/app/models/master_state';
import { TalukMaster } from 'src/app/models/master_taluk';

@Injectable({
  providedIn: 'root',
})
export class MasterDataService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _dataService: DataStoreService
  ) {}

  setDistrictMasterData(user: User): Observable<DistrictMaster[]> {
    let districtSubject: Subject<DistrictMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_district_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for District List: ' + JSON.stringify(resp)
          );
          let _districts: DistrictMaster[] = [];
          let districts = resp.data as Array<any>;
          districts.forEach((district) => {
            let _district = DistrictMaster.mapJsonToDistrict(district);
            _districts.push(_district);
          });
          console.log('Districts Array: ' + _districts.length);
          this.addToDB(_districts);
          return _districts;
        })
      )
      .subscribe((value) => {
        districtSubject.next(value);
      });
    return districtSubject;
  }

  addToDB(districtList: Array<any>) {
    this._dataService.db.districts
      .bulkAdd(districtList)
      .then(() => {
        console.log('Finished adding districts to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting districts to db:', error);
      });
  }

  getDistrictsList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    //return this.db.facilities.toCollection();
    this._dataService.db.districts
      .toArray()
      .then((value: Array<any>) => {
        console.log('districts value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setDistrictMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('districts error:', error);
      });
    return response;
  }

  setBlockMasterData(user: User): Observable<BlockMaster[]> {
    let blockSubject: Subject<BlockMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_block_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for Block List: ' + JSON.stringify(resp)
          );
          let _blocks: BlockMaster[] = [];
          let blocks = resp.data as Array<any>;
          blocks.forEach((block) => {
            let _block = BlockMaster.mapJsonToBlock(block);
            _blocks.push(_block);
          });
          console.log('Block Array: ' + _blocks.length);
          this.addBlocksToDB(_blocks);
          return _blocks;
        })
      )
      .subscribe((value) => {
        blockSubject.next(value);
      });
    return blockSubject;
  }

  addBlocksToDB(blockList: Array<any>) {
    this._dataService.db.blocks
      .bulkAdd(blockList)
      .then(() => {
        console.log('Finished adding Block to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting blocks to db:', error);
      });
  }

  getBlocksList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    //return this.db.facilities.toCollection();
    this._dataService.db.blocks
      .toArray()
      .then((value: Array<any>) => {
        console.log('blocks value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setBlockMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Blocks error:', error);
      });
    return response;
  }

  setVillageMasterData(user: User): Observable<VillageMaster[]> {
    let villageSubject: Subject<VillageMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_village_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for Block List: ' + JSON.stringify(resp)
          );
          let _villages: VillageMaster[] = [];
          let villages = resp.data as Array<any>;
          villages.forEach((village) => {
            let _village = VillageMaster.mapJsonToVillage(village);
            _villages.push(_village);
          });
          console.log('Village Array: ' + _villages.length);
          this.addVillagesToDB(_villages);
          return _villages;
        })
      )
      .subscribe((value) => {
        villageSubject.next(value);
      });
    return villageSubject;
  }

  addVillagesToDB(villageList: Array<any>) {
    this._dataService.db.villages
      .bulkAdd(villageList)
      .then(() => {
        console.log('Finished adding Block to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting villages to db:', error);
      });
  }

  getVillageList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    //return this.db.facilities.toCollection();
    this._dataService.db.villages
      .toArray()
      .then((value: Array<any>) => {
        console.log('Villages value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setVillageMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Villages error:', error);
      });
    return response;
  }

  setFacilityData(user: User): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      GOVT_DEPARTMENT: Constants.GOVT_DEPT_HEALTH,
    };

    this._http
      .post<any>(`admin_api_get_facility_master`, request)
      .pipe(
        map((resp) => {
          console.log('get facility list response:', resp);
          const facilityList: Array<any> = [];
          let facilities = resp.data as Array<any>;
          facilities.forEach((facility) => {
            facilityList.push({
              facility_id: facility.facility_id,
              facility_name: facility.facility_name,
              institution_gid: facility.institution_gid,
              block_id: facility.block_id,
              district_id: facility.district_id,
              directorate_id: facility.directorate_id,
              owner_id: facility.owner_id,
              directorate_name: facility.directorate_name,
              category_id: facility.category_id,
              category_name: facility.category_name,
              facility_type_id: facility.facility_type_id,
              facility_type_name: facility.facility_type_name,
              facility_level_id: facility.facility_level_id,
              facility_level: facility.facility_level,
              parent_facility: facility.parent_facility,
            });

            // Insert to array if not already exist.
            // if (
            //   !blockList.find(
            //     (block) => facility && block.block_id === facility.block_id
            //   )
            // ) {
            //   blockList.push({
            //     block_id: facility.block_id,
            //     block_name: facility.block_name,
            //   });
            // }
          });

          this.addFacilitiesToDB(facilityList);

          return facilityList;

          //console.log('Block Array: ' + blockList.length);
          //localforage.setItem('BLOCK_MASTER', blockList);
          //console.log('Users Array: ' + _facilities.length);
        })
      )
      .subscribe((value) => {
        response.next(value);
      });

    return response;
  }

  addFacilitiesToDB(facilityList: Array<any>) {
    this._dataService.db.facilities
      .bulkAdd(facilityList)
      .then(() => {
        console.log('Finished adding facilities to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting facilities to db:', error);
      });
  }

  getFacilityList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    //return this.db.facilities.toCollection();
    this._dataService.db.facilities
      .toArray()
      .then((value: Array<any>) => {
        console.log('value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setFacilityData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('error:', error);
      });
    return response;
  }

  setDepartmentMasterData(user: User): Observable<DepartmentMaster[]> {
    let departmentSubject: Subject<DepartmentMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_department_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for Department List: ' + JSON.stringify(resp)
          );
          let _departments: DepartmentMaster[] = [];
          let departments = resp.data as Array<any>;
          departments.forEach((department) => {
            let _department = DepartmentMaster.mapJsonToDepartment(department);
            _departments.push(_department);
          });
          console.log('Block Array: ' + _departments.length);
          this.addDepartmentsToDB(_departments);
          return _departments;
        })
      )
      .subscribe((value) => {
        departmentSubject.next(value);
      });
    return departmentSubject;
  }

  addDepartmentsToDB(departmentList: Array<any>) {
    this._dataService.db.departments
      .bulkAdd(departmentList)
      .then(() => {
        console.log('Finished adding Departments to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting departments to db:', error);
      });
  }

  getDepartmentList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    //return this.db.facilities.toCollection();
    this._dataService.db.departments
      .toArray()
      .then((value: Array<any>) => {
        console.log('departments value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setDepartmentMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Department error:', error);
      });
    return response;
  }

  setClinicMasterData(user: User): Observable<ClinicMaster[]> {
    let departmentSubject: Subject<ClinicMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_clinic_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for Clinic List: ' + JSON.stringify(resp)
          );
          let _clinics: ClinicMaster[] = [];
          let clinics = resp.data as Array<any>;
          clinics.forEach((clinic) => {
            let _clinic = ClinicMaster.mapJsonToClinic(clinic);
            _clinics.push(_clinic);
          });
          console.log('Clinic Array: ' + _clinics.length);
          this.addClinicsToDB(_clinics);
          return _clinics;
        })
      )
      .subscribe((value) => {
        departmentSubject.next(value);
      });
    return departmentSubject;
  }

  addClinicsToDB(clinicList: Array<any>) {
    this._dataService.db.clinics
      .bulkAdd(clinicList)
      .then(() => {
        console.log('Finished adding Clinics to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting clinics to db:', error);
      });
  }

  getClinicList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.clinics
      .toArray()
      .then((value: Array<any>) => {
        console.log('clinics value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setClinicMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Clinics error:', error);
      });
    return response;
  }

  setClinicTypeMasterData(user: User): Observable<ClinicTypeMaster[]> {
    let clinicTypesSubject: Subject<ClinicTypeMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_clinic_type_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for Clinic List: ' + JSON.stringify(resp)
          );
          let _clinicTypes: ClinicTypeMaster[] = [];
          let clinicTypes = resp.data as Array<any>;
          clinicTypes.forEach((clinicType) => {
            let _clinicType = ClinicTypeMaster.mapJsonToClinicType(clinicType);
            _clinicTypes.push(_clinicType);
          });
          console.log('Clini type Array: ' + _clinicTypes.length);
          this.addClinicTypesToDB(_clinicTypes);
          return _clinicTypes;
        })
      )
      .subscribe((value) => {
        clinicTypesSubject.next(value);
      });
    return clinicTypesSubject;
  }

  addClinicTypesToDB(clinicTypeList: Array<any>) {
    this._dataService.db.clinicTypes
      .bulkAdd(clinicTypeList)
      .then(() => {
        console.log('Finished adding Clinic types to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting clinic types to db:', error);
      });
  }

  getClinicTypeList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.clinicTypes
      .toArray()
      .then((value: Array<any>) => {
        console.log('clinic type value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setClinicTypeMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Clinic types error:', error);
      });
    return response;
  }

  setEmployeeDesignationMasterData(
    user: User
  ): Observable<EmployeeDesignationMaster[]> {
    let employeeDesignationsSubject: Subject<EmployeeDesignationMaster[]> =
      new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_employee_designation_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Response from API for Employee designation List: ' +
              JSON.stringify(resp)
          );
          let _employeeDesignations: EmployeeDesignationMaster[] = [];
          let employeeDesignations = resp.data as Array<any>;
          employeeDesignations.forEach((employeeDesignation) => {
            let _employeeDesignation =
              EmployeeDesignationMaster.mapJsonToEmployeeDesignation(
                employeeDesignation
              );
            _employeeDesignations.push(_employeeDesignation);
          });
          console.log(
            'Employee designation array: ' + _employeeDesignations.length
          );
          this.addEmployeeDesignationsToDB(_employeeDesignations);
          return _employeeDesignations;
        })
      )
      .subscribe((value) => {
        employeeDesignationsSubject.next(value);
      });
    return employeeDesignationsSubject;
  }

  addEmployeeDesignationsToDB(employeeDesignationList: Array<any>) {
    this._dataService.db.employeeDesignations
      .bulkAdd(employeeDesignationList)
      .then(() => {
        console.log('Finished adding Employee designations to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Error while inserting Employee designations to db:',
          error
        );
      });
  }

  getEmployeeDesignationList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.employeeDesignations
      .toArray()
      .then((value: Array<any>) => {
        console.log('Employee designation list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setEmployeeDesignationMasterData(currentUser).subscribe(
              (value) => {
                response.next(value);
              }
            );
          }
        }
      })
      .catch((error: any) => {
        console.log('Employee designations error:', error);
      });
    return response;
  }

  setHabitationMasterData(user: User): Observable<HabitationMaster[]> {
    let habitationsSubject: Subject<HabitationMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_habitation_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for habitation List: ' +
              JSON.stringify(resp)
          );
          let _habitations: HabitationMaster[] = [];
          let habitations = resp.data as Array<any>;
          habitations.forEach((habitation) => {
            let _habitation = HabitationMaster.mapJsonToHabitation(habitation);
            _habitations.push(_habitation);
          });
          console.log('Master-data | habitation array: ' + _habitations.length);
          this.addHabitationsToDB(_habitations);
          return _habitations;
        })
      )
      .subscribe((value) => {
        habitationsSubject.next(value);
      });
    return habitationsSubject;
  }

  addHabitationsToDB(habitationList: Array<any>) {
    this._dataService.db.habitations
      .bulkAdd(habitationList)
      .then(() => {
        console.log('Master-data | Finished adding Habitations to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting Habitations to db:',
          error
        );
      });
  }

  getHabitationList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.habitations
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | habitation list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setHabitationMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | habitation error:', error);
      });
    return response;
  }

  setRevVillageMasterData(user: User): Observable<RevVillageMaster[]> {
    let revVillagesSubject: Subject<RevVillageMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_revenue_village_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for village List: ' +
              JSON.stringify(resp)
          );
          let _revVillages: RevVillageMaster[] = [];
          let revVillages = resp.data as Array<any>;
          revVillages.forEach((revVillage) => {
            let _revVillage = RevVillageMaster.mapJsonToRevVillage(revVillage);
            _revVillages.push(_revVillage);
          });
          console.log(
            'Master-data | revVillages array: ' + _revVillages.length
          );
          this.addRevVillagesToDB(_revVillages);
          return _revVillages;
        })
      )
      .subscribe((value) => {
        revVillagesSubject.next(value);
      });
    return revVillagesSubject;
  }

  addRevVillagesToDB(revVillageList: Array<any>) {
    this._dataService.db.revVillages
      .bulkAdd(revVillageList)
      .then(() => {
        console.log('Master-data | Finished adding revVillages to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting revVillages to db:',
          error
        );
      });
  }

  getRevVillageList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.revVillages
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | revVillages list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setRevVillageMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | revVillages error:', error);
      });
    return response;
  }

  setOwnersMasterData(user: User): Observable<OwnerMaster[]> {
    let ownersSubject: Subject<OwnerMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_facility_owner_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for owner List: ' +
              JSON.stringify(resp)
          );
          let _owners: OwnerMaster[] = [];
          let owners = resp.data as Array<any>;
          owners.forEach((owner) => {
            let _owner = OwnerMaster.mapJsonToOwner(owner);
            _owners.push(_owner);
          });
          console.log('Master-data | revVillages array: ' + _owners.length);
          this.addOwnersToDB(_owners);
          return _owners;
        })
      )
      .subscribe((value) => {
        ownersSubject.next(value);
      });
    return ownersSubject;
  }

  addOwnersToDB(ownerList: Array<any>) {
    this._dataService.db.owners
      .bulkAdd(ownerList)
      .then(() => {
        console.log('Master-data | Finished adding owners to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Master-data | Error while inserting owners to db:', error);
      });
  }

  getOwnersList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.owners
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | owners list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setOwnersMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | owners error:', error);
      });
    return response;
  }

  setDirectoratesMasterData(user: User): Observable<DirectorateMaster[]> {
    let directoratesSubject: Subject<DirectorateMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_facility_directorate_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for directorate List: ' +
              JSON.stringify(resp)
          );
          let _directorates: DirectorateMaster[] = [];
          let directorates = resp.data as Array<any>;
          directorates.forEach((directorate) => {
            let _directorate =
              DirectorateMaster.mapJsonToDirectorate(directorate);
            _directorates.push(_directorate);
          });
          console.log(
            'Master-data | directorate array: ' + _directorates.length
          );
          this.addDirectoratesToDB(_directorates);
          return _directorates;
        })
      )
      .subscribe((value) => {
        directoratesSubject.next(value);
      });
    return directoratesSubject;
  }

  addDirectoratesToDB(directorateList: Array<any>) {
    this._dataService.db.directorates
      .bulkAdd(directorateList)
      .then(() => {
        console.log('Master-data | Finished adding directorates to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting directorates to db:',
          error
        );
      });
  }

  getDirectoratesList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.directorates
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | directorates list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setDirectoratesMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | directorates error:', error);
      });
    return response;
  }

  setCategoriesMasterData(user: User): Observable<CategoryMaster[]> {
    let categoriesSubject: Subject<CategoryMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_facility_category_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for directorate List: ' +
              JSON.stringify(resp)
          );
          let _categories: CategoryMaster[] = [];
          let categories = resp.data as Array<any>;
          categories.forEach((category) => {
            let _category = CategoryMaster.mapJsonToCategory(category);
            _categories.push(_category);
          });
          console.log('Master-data | category array: ' + _categories.length);
          this.addCategoriesToDB(_categories);
          return _categories;
        })
      )
      .subscribe((value) => {
        categoriesSubject.next(value);
      });
    return categoriesSubject;
  }

  addCategoriesToDB(categoriesList: Array<any>) {
    this._dataService.db.categories
      .bulkAdd(categoriesList)
      .then(() => {
        console.log('Master-data | Finished adding categoriesList to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting categoriesList to db:',
          error
        );
      });
  }

  getCategoriesList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.categories
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | categories list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setCategoriesMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | categories error:', error);
      });
    return response;
  }

  setFacilityTypeMasterData(user: User): Observable<FacilityTypeMaster[]> {
    let facilityTypesSubject: Subject<FacilityTypeMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_facility_type_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for facilityTypes List: ' +
              JSON.stringify(resp)
          );
          let _facilityTypes: FacilityTypeMaster[] = [];
          let facilityTypes = resp.data as Array<any>;
          facilityTypes.forEach((facilityType) => {
            let _facilityType =
              FacilityTypeMaster.mapJsonToFacilityType(facilityType);
            _facilityTypes.push(_facilityType);
          });
          console.log(
            'Master-data | facilityType array: ' + _facilityTypes.length
          );
          this.addFacilityTypesToDB(_facilityTypes);
          return _facilityTypes;
        })
      )
      .subscribe((value) => {
        facilityTypesSubject.next(value);
      });
    return facilityTypesSubject;
  }

  addFacilityTypesToDB(facilityTypeList: Array<any>) {
    this._dataService.db.facilityTypes
      .bulkAdd(facilityTypeList)
      .then(() => {
        console.log('Master-data | Finished adding facilityTypeLists to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting facilityTypeLists to db:',
          error
        );
      });
  }

  getFacilityTypesList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.facilityTypes
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | facilityTypes list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setFacilityTypeMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | facilityTypes error:', error);
      });
    return response;
  }

  setFacilityLevelMasterData(user: User): Observable<FacilityLevelMaster[]> {
    let facilityLevelsSubject: Subject<FacilityLevelMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_facility_level_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for FacilityLevels List: ' +
              JSON.stringify(resp)
          );
          let _facilityLevels: FacilityLevelMaster[] = [];
          let facilityLevels = resp.data as Array<any>;
          facilityLevels.forEach((facilityLevel) => {
            let _facilityLevel =
              FacilityLevelMaster.mapJsonToFacilityLevel(facilityLevel);
            _facilityLevels.push(_facilityLevel);
          });
          console.log(
            'Master-data | facilityLevel array: ' + _facilityLevels.length
          );
          this.addFacilityLevelsToDB(_facilityLevels);
          return _facilityLevels;
        })
      )
      .subscribe((value) => {
        facilityLevelsSubject.next(value);
      });
    return facilityLevelsSubject;
  }

  addFacilityLevelsToDB(facilityLevelList: Array<any>) {
    this._dataService.db.facilityLevels
      .bulkAdd(facilityLevelList)
      .then(() => {
        console.log('Master-data | Finished adding facilityLevel Lists to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting facilityLevel Lists to db:',
          error
        );
      });
  }

  getFacilityLevelsList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.facilityLevels
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | facilityLevels list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setFacilityLevelMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | facilityLevels error:', error);
      });
    return response;
  }

  setHudMasterData(user: User): Observable<HudMaster[]> {
    let hudsSubject: Subject<HudMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_hud_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for HudMaster List: ' +
              JSON.stringify(resp)
          );
          let _huds: HudMaster[] = [];
          let huds = resp.data as Array<any>;
          huds.forEach((hud) => {
            let _hud = HudMaster.mapJsonToHud(hud);
            _huds.push(_hud);
          });
          console.log('Master-data | hud array: ' + _huds.length);
          this.addHudsToDB(_huds);
          return _huds;
        })
      )
      .subscribe((value) => {
        hudsSubject.next(value);
      });
    return hudsSubject;
  }

  addHudsToDB(hudList: Array<any>) {
    this._dataService.db.huds
      .bulkAdd(hudList)
      .then(() => {
        console.log('Master-data | Finished adding hudList Lists to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting hudList Lists to db:',
          error
        );
      });
  }

  getHudList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.huds
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | hud list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setHudMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | hud list error:', error);
      });
    return response;
  }

  addStatesToDB(stateList: Array<any>) {
    this._dataService.db.states
      .bulkAdd(stateList)
      .then(() => {
        console.log('Master-data | Finished adding stateList to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Master-data | Error while inserting stateList to db:', error);
      });
  }

  setStateMasterData(user: User): Observable<StateMaster[]> {
    let statesSubject: Subject<StateMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_state_master`, request)
      .pipe(
        map((resp) => {
          console.log("Master-data | Response from API for StateMaster List: " + JSON.stringify(resp))
          let _states: StateMaster[] = [];
          let states = resp.data as Array<any>;
          states.forEach((state) => {
            let _state = StateMaster.mapJsonToState(state);
            _states.push(_state);
          });
          console.log('Master-data | state array: ' + _states.length);
          this.addStatesToDB(_states);
          return _states;
        })
      )
      .subscribe((value) => {
        statesSubject.next(value);
      });
    return statesSubject;
  }

  getStateList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.states
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | state list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setStateMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | hud list error:', error);
      });
    return response;
  }

  setEmpRolesMasterData(user: User): Observable<EmployeeRoleMaster[]> {
    let rolesSubject: Subject<EmployeeRoleMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_role_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for role List: ' +
              JSON.stringify(resp)
          );
          let _roles: EmployeeRoleMaster[] = [];
          let roles = resp.data as Array<any>;
          roles.forEach((role) => {
            let _role = EmployeeRoleMaster.mapJsonToEmployeeRole(role);
            _roles.push(_role);
          });
          console.log('Master-data | role array: ' + _roles.length);
          this.addRolesToDB(_roles);
          return _roles;
        })
      )
      .subscribe((value) => {
        rolesSubject.next(value);
      });
    return rolesSubject;
  }

  addRolesToDB(roleList: Array<any>) {
    this._dataService.db.employeeRoles
      .bulkAdd(roleList)
      .then(() => {
        console.log('Master-data | Finished adding roleList Lists to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting roleList Lists to db:',
          error
        );
      });
  }

  getEmpRoleList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.employeeRoles
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | employeeRoles list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setEmpRolesMasterData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | employeeRoles list error:', error);
      });
    return response;
  }

  setAssemblyData(user: User): Observable<AssemblyConstituency[]> {
    let assemblySubject: Subject<AssemblyConstituency[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_constituency_assembly_master`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for assembly List: ' +
              JSON.stringify(resp)
          );
          let _assembly: AssemblyConstituency[] = [];
          let assembly = resp.data as Array<any>;
          assembly.forEach((assembly) => {
            let _assemblyConstituency =
              AssemblyConstituency.mapJsonToAssembly(assembly);
            _assembly.push(_assemblyConstituency);
          });
          console.log('Master-data | role array: ' + _assembly.length);
          this.addAssemblyToDB(_assembly);
          return _assembly;
        })
      )
      .subscribe((value) => {
        assemblySubject.next(value);
      });
    return assemblySubject;
  }

  addAssemblyToDB(assemblyList: Array<any>) {
    this._dataService.db.asseblyConstituencies
      .bulkAdd(assemblyList)
      .then(() => {
        console.log('Master-data | Finished adding assemblyList Lists to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting assemblyList Lists to db:',
          error
        );
      });
  }

  getAssemblyConstituencyList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.asseblyConstituencies
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | asseblyConstituencies list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setAssemblyData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | assemblyList list error:', error);
      });
    return response;
  }

  setParliamentData(user: User): Observable<ParliamentConstituency[]> {
    let parliamentSubject: Subject<ParliamentConstituency[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(
        `admin_api_get_constituency_parliamentary`,
        request
      )
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for parliament List: ' +
              JSON.stringify(resp)
          );
          let _parliament: ParliamentConstituency[] = [];
          let parliament = resp.data as Array<any>;
          parliament.forEach((parliament) => {
            let _parliamentConstituency =
              ParliamentConstituency.mapJsonToParliament(parliament);
            _parliament.push(_parliamentConstituency);
          });
          console.log('Master-data | parliament array: ' + _parliament.length);
          this.addParliamentToDB(_parliament);
          return _parliament;
        })
      )
      .subscribe((value) => {
        parliamentSubject.next(value);
      });
    return parliamentSubject;
  }

  addParliamentToDB(parliamentList: Array<any>) {
    this._dataService.db.parlimentaryConstituencies
      .bulkAdd(parliamentList)
      .then(() => {
        console.log(
          'Master-data | Finished adding parliamentList Lists to db.'
        );
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting parliamentList Lists to db:',
          error
        );
      });
  }

  getParliamentConstituencyList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.parlimentaryConstituencies
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | parlimentaryConstituencies list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setParliamentData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | parliamentList list error:', error);
      });
    return response;
  }

  setTalukData(user: User): Observable<TalukMaster[]> {
    let talukSubject: Subject<TalukMaster[]> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
    };

    this._http
      .post<any>(`admin_api_get_taluk_master`, request)
      .pipe(
        map((resp) => {
          console.log(
            'Master-data | Response from API for taluk List: ' +
              JSON.stringify(resp)
          );
          let talukList: TalukMaster[] = [];
          let taluk = resp.data as Array<any>;
          taluk.forEach((record) => {
            // need to be remove later
            if (record.district_ids) {
              record.district_id = record.district_ids;
              delete record.district_ids;
            }
            //remove end
            let temp = TalukMaster.mapJsonToTaluk(record);
            talukList.push(temp);
          });
          console.log('Master-data | taluk array: ' + talukList.length);
          this.addTalukDataToDB(talukList);
          return talukList;
        })
      )
      .subscribe((value) => {
        talukSubject.next(value);
      });
    return talukSubject;
  }

  addTalukDataToDB(talukList: Array<any>) {
    this._dataService.db.taluks
      .bulkAdd(talukList)
      .then(() => {
        console.log('Master-data | Finished adding taluk List to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log(
          'Master-data | Error while inserting taluk List to db:',
          error
        );
      });
  }

  getTalukList(): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.taluks
      .toArray()
      .then((value: Array<any>) => {
        console.log('Master-data | taluk list:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setTalukData(currentUser).subscribe((value) => {
              response.next(value);
            });
          }
        }
      })
      .catch((error: any) => {
        console.log('Master-data | taluk list error:', error);
      });
    return response;
  }
}
