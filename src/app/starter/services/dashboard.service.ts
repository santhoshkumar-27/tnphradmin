import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import Dexie from 'dexie';
import { DataMaster } from 'src/app/models/master_data';
import { FacilityMaster } from 'src/app/models/master_facility';
import { User } from 'src/app/models/user';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { environment } from 'src/environments/environment';
import { Constants } from 'src/app/config/constants/constants';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private baseUrl = environment.serviceApiBaseUrl;

  constructor(
    private _http: HttpClient,
    private _router: Router
  ) {}

  getUserAggregate(user: User, filters: any=null): Observable<User[]> {
    console.log('incoming filter user aggregate = ', filters);
    let userSubject: Subject<User[]> = new Subject();
    let _filters: any = null;
    if (!filters && (user.phr_role == Constants.WEB_BLOCK_ADMIN || Constants.WEB_DISTRICT_ADMIN || Constants.BLOCK_ADMIN || Constants.DISTRICT_ADMIN)){
      _filters = {
        DISTRICT_ID: user.district_id,
        BLOCK_ID: user.block_id
      }
    } else if(filters) {
      _filters = filters;
    } else{
      _filters = {
        DISTRICT_ID: null,
        BLOCK_ID: null
      }
    }
    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: _filters
    };

    this._http
      .post<any>(`admin_api_dashboard_user_aggregate`, request)
      .pipe(
        map((resp) => {
          console.log("Response from API for User Aggregate: " + JSON.stringify(resp))
          return resp.data;
        })
      )
      .subscribe((value) => {
        userSubject.next(value);
      });
    return userSubject;
  }

  getFacilityAggregate(user: User, filters: any=null): Observable<User[]> {
    console.log('incoming filter facility aggregate = ', filters);
    let userSubject: Subject<User[]> = new Subject();
    let _filters: any = null;
    if (!filters && (user.phr_role == Constants.WEB_BLOCK_ADMIN || Constants.WEB_DISTRICT_ADMIN || Constants.BLOCK_ADMIN || Constants.DISTRICT_ADMIN)){
      _filters = {
        DISTRICT_ID: user.district_id,
        BLOCK_ID: user.block_id
      }
    } else if(filters) {
      _filters = filters;
    } else{
      _filters = {
        DISTRICT_ID: null,
        BLOCK_ID: null
      }
    }

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: _filters
    };

    this._http
      .post<any>(`admin_api_dashboard_facility_aggregate`, request)
      .pipe(
        map((resp) => {
          console.log("Response from API for Facility Aggregate: " + JSON.stringify(resp))
          return resp.data;
        })
      )
      .subscribe((value) => {
        userSubject.next(value);
      });
    return userSubject;
  }

  getStreetAggregate(user: User,  filters: any=null): Observable<User[]> {
    console.log('incoming filter street aggregate = ', filters);
    
    let userSubject: Subject<User[]> = new Subject();
    let _filters: any = null;
    if (!filters && (user.phr_role == Constants.WEB_BLOCK_ADMIN || Constants.WEB_DISTRICT_ADMIN || Constants.BLOCK_ADMIN || Constants.DISTRICT_ADMIN)){
      _filters = {
        DISTRICT_ID: user.district_id,
        BLOCK_ID: user.block_id
      }
    } else if(filters) {
      _filters = filters;
    } else {
      _filters = {
        DISTRICT_ID: null,
        BLOCK_ID: null
      }
    }

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: _filters
    };

    this._http
      .post<any>(`admin_api_dashboard_street_aggregates`, request)
      .pipe(
        map((resp) => {
          console.log("Response from API for Street Aggregate: " + JSON.stringify(resp))
          return resp.data;
        })
      )
      .subscribe((value) => {
        userSubject.next(value);
      });
    return userSubject;
  }

  getShopAggregate(user: User,  filters: any=null): Observable<User[]> {
    console.log('incoming filter shop aggregate = ', filters);
    
    let userSubject: Subject<User[]> = new Subject();
    let _filters: any = null;
    if (!filters && (user.phr_role == Constants.WEB_BLOCK_ADMIN || Constants.WEB_DISTRICT_ADMIN || Constants.BLOCK_ADMIN || Constants.DISTRICT_ADMIN)){
      _filters = {
        DISTRICT_ID: user.district_id,
        BLOCK_ID: user.block_id
      }
    } else if(filters) {
      _filters = filters;
    } else {
      _filters = {
        DISTRICT_ID: null,
        BLOCK_ID: null
      }
    }

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: _filters
    };

    this._http
      .post<any>(`admin_api_dashboard_shop_aggregate`, request)
      .pipe(
        map((resp) => {
          console.log("Response from API for Shop Aggregate: " + JSON.stringify(resp))
          return resp.data;
        })
      )
      .subscribe((value) => {
        userSubject.next(value);
      });
    return userSubject;
  }


  getPopulationAggregate(user: User,  filters: any=null): Observable<User[]> {
    console.log('incoming filter population aggregate = ', filters);
    
    let userSubject: Subject<User[]> = new Subject();
    let _filters: any = null;
    if (!filters && (user.phr_role == Constants.WEB_BLOCK_ADMIN || Constants.WEB_DISTRICT_ADMIN || Constants.BLOCK_ADMIN || Constants.DISTRICT_ADMIN)){
      _filters = {
        DISTRICT_ID: user.district_id,
        BLOCK_ID: user.block_id
      }
    } else if(filters) {
      _filters = filters;
    } else {
      _filters = {
        DISTRICT_ID: null,
        BLOCK_ID: null
      }
    }

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      FILTERS: _filters
    };

    this._http
      .post<any>(`admin_api_dashboard_population_aggregates`, request)
      .pipe(
        map((resp) => {
          console.log("Response from API for Population Aggregate: " + JSON.stringify(resp))
          return resp.data;
        })
      )
      .subscribe((value) => {
        userSubject.next(value);
      });
    return userSubject;
  }


  getHeaders(token: string | null): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-access-token': token? token : '',
    });

    return headers;
  }

}
