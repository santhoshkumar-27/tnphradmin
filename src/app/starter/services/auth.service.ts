import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { User } from 'src/app/models/user';
import { Constants } from 'src/app/config/constants/constants';
import { Router } from '@angular/router';
import { DataStoreService } from './datastore.service';
import { MasterDataService } from './master-data.service';

const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.authApiBaseUrl;
  currentUser: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  md_progress_event: BehaviorSubject<any> = new BehaviorSubject<boolean>(false);
  validToken: boolean = false;

  /**
   * Constructor
   * @param {HttpClient} _http
   */
  constructor(
    private _http: HttpClient,
    private _router: Router,
    private _storageService: DataStoreService,
    private _maseterDataService: MasterDataService
  ) {
    let currUser = sessionStorage.getItem(Constants.CURRENT_USER);
    if (currUser) {
      let user = User.mapJsonToUser(JSON.parse(currUser));
      this.currentUser.next(user);
    } else {
      this._router.navigateByUrl('/login');
    }
  }

  public get getCurrentUser() {
    return this.currentUser.value;
  }

  loginWithMobile(mobileNumber: number) {
    let request = {
      mobile_number: mobileNumber,
    };
    return this._http.post<any>(`admin_api_sendotp`, request);
  }

  validateToken() {
    return this._http.get<any>(`admin_api_validate_token`).pipe(map((resp) => {
          if (resp.message.includes('Invalid Token')) {
            throw new HttpErrorResponse({
              error: 'Invalid Token',
              // headers: evt.headers,
              status: 401,
              statusText: 'Error',
              // url: evt.url
          })
          }
    }));
  }

  ValidateOTP(mobileNumber: number, otp: number) {
    let request = {
      mobile_number: mobileNumber,
      otp: otp,
    };
    return this._http
      .post<any>(`admin_api_validateotp`, request)
      .pipe(
        map((resp) => {
          console.log('OTP valiation success.' + resp);
          if (resp.data) {
            let user = User.mapJsonToUser(resp.data);
            // user.auth_token = resp.data[0]['token'];
            //this._storageService.clearDatastore();
            this._storageService.clearTables();
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            sessionStorage.setItem(
              Constants.CURRENT_USER,
              JSON.stringify(user)
            );
            this.currentUser.next(user);

            // Load all master data to local db.
            this.loadAllMasterDta();

            return resp;
          } else {
            console.error('No userdata in response.');
            this.logout();
            return resp;
          }
        })
      );
  }

  logout(fromFlag: string = '') {
    sessionStorage.removeItem(Constants.CURRENT_USER);
    sessionStorage.clear();
    this.validToken = false;
    this.currentUser.next(null);
    this._storageService.clearTables();
    if (fromFlag === 'INVALID_LOGIN') {
      this._router.navigateByUrl('/error');
    } else {
      this._router.navigateByUrl('/login');
    }
  }

  /**
   * Once login success prefetch and load all master data.
   * Master data records will be used in other services
   */
  loadAllMasterDta() {
    this.md_progress_event.next(true);

    let districtSubscriber = this._maseterDataService.getDistrictsList();
    let blockSubscriber = this._maseterDataService.getBlocksList();

    let villageSubscriber = this._maseterDataService.getVillageList();
    let facilitySubscriber = this._maseterDataService.getFacilityList();
    let departmentListSubscriber = this._maseterDataService.getDepartmentList();
    let clinicSubscriber = this._maseterDataService.getClinicList();
    let clinicTypeSubscriber = this._maseterDataService.getClinicTypeList();
    // the following is failing as its a huge list.
    // this._maseterDataService.getHabitationList().subscribe(() => {
    //   console.log('Habitation master data loaded.');
    // });
    let revVillageSubscriber = this._maseterDataService.getRevVillageList();
    let ownersSubscriber = this._maseterDataService.getOwnersList();
    let directorateSubscriber = this._maseterDataService.getDirectoratesList();

    let categorySubscriber = this._maseterDataService.getCategoriesList();

    let facilityTypeSubscriber =
      this._maseterDataService.getFacilityTypesList();

    let facilityLevelSubscriber =
      this._maseterDataService.getFacilityLevelsList();

    let hudListSubscriber = this._maseterDataService.getHudList();

    let empRoleSubscriber = this._maseterDataService.getEmpRoleList();

    let talukSubscriber = this._maseterDataService.getTalukList();

    let allSubscribers = [
      districtSubscriber,
      blockSubscriber,
      villageSubscriber,
      facilitySubscriber,
      departmentListSubscriber,
      clinicSubscriber,
      clinicTypeSubscriber,
      revVillageSubscriber,
      ownersSubscriber,
      directorateSubscriber,
      categorySubscriber,
      facilityTypeSubscriber,
      facilityLevelSubscriber,
      hudListSubscriber,
      empRoleSubscriber,
      talukSubscriber,
    ];

    combineLatest(allSubscribers).subscribe(([]) => {
      console.log('Finished adding master data to db');
      this.md_progress_event.next(false);
    });
  }
}
