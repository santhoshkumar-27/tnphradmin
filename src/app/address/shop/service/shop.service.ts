import { Injectable }   from '@angular/core';
import { HttpClient, HttpHeaders }   from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import Dexie from 'dexie';
import { Shop } from 'src/app/models/shop';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/models/user';
import { map } from 'rxjs/operators';
import { StreetMaster } from 'src/app/models/master_street';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { Constants } from 'src/app/config/constants/constants';
 
@Injectable()
export class ShopService {
    private baseUrl = environment.serviceApiBaseUrl;
   
  constructor(private _http: HttpClient, private _dataService: DataStoreService) { }

  upsertShop(user: User, shop: Shop): Observable<string> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      SHOP_DATA: shop,
    };

    this._http
      .post<any>(`admin_api_upsert_shop`, request)
      .subscribe(
        (value)=>{
          response.next(value.status);
        }
      )
    return response;  
  }    
   
  getShops(user: User, filters:any, pageIndex : number=0, pageSize : number): Observable<Shop[]> {
    let request = {
        "USER_ID": user.user_id,
        "USER_PHR_ROLE": user.phr_role,
        "USER_FACILITY_ID": user.facility_id,
        "FILTERS": filters,
        "LIMIT": pageSize,
        "OFFSET":pageIndex*pageSize
      };
    return this._http.post<Shop[]>(`admin_api_get_shop_list`, request);
  }

  setStreetData(user: User, filters:any,): Observable<any[]>{
    let response: Subject<StreetMaster[]> = new Subject();
    let request = {
      "USER_ID": user.user_id,
      "USER_PHR_ROLE": user.phr_role,
      "USER_FACILITY_ID": user.facility_id,
      "FILTERS": filters,
    };

    this._http
      .post<any>(`admin_api_get_street_master`, request)
      .pipe(
        map((resp) => {
          console.log("Response from API for Street Master: " + JSON.stringify(resp))
          let _streets: StreetMaster[] = [];
          let streets = resp.data as Array<any>;
          streets.forEach(facility => {
            let _street = StreetMaster.mapJsonToStreet(facility);
            _streets.push(_street);
          });
          console.log("Streets Array: " + _streets.length);

          this.addToDB(_streets);
          return _streets;
        })
      )
      .subscribe(
        (value)=>{
          response.next(value);
        }
      )
    return response;

  }
  addToDB(streetList: StreetMaster[]) {
    this._dataService.db.streets
      .bulkAdd(streetList)
      .then(() => {
        console.log('Finished adding facilities to db.');
      })
      .catch(Dexie.BulkError, (error: any) => {
        console.log('Error while inserting facilities to db:', error);
      });
  }

  getStreetList(filters: any): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    this._dataService.db.streets
      .toArray()
      .then((value: Array<any>) => {
        console.log('Street value:', value);
        if (value.length > 0) {
          response.next(value);
        } else {
          let userString = sessionStorage.getItem(Constants.CURRENT_USER);
          if (userString) {
            let currentUser = User.mapJsonToUser(JSON.parse(userString));
            this.setStreetData(currentUser, filters).subscribe((value: any) => {
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
  setFacilityData(currentUser: User) {
    throw new Error('Method not implemented.');
  }

  getHeaders(token: string | null): HttpHeaders{

    let headers = new HttpHeaders({ 
      "Content-Type": "application/json",
      "x-access-token": token? token : ''
    });

    return headers
  }

  getStreetListForce(filters: any): Observable<any[]> {
    let response: Subject<any[]> = new Subject();
    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    if (userString) {
      let currentUser = User.mapJsonToUser(JSON.parse(userString));
      this.setStreetData(currentUser, filters).subscribe((value: any) => {
        response.next(value);
      });
    } else {
      console.log('Shop Service | User session empty.');
      response.next([]);
    }
    return response;
  }

  getDistrictName(districtId: string): Promise<string> {
    return this._dataService.db.districts.get(districtId).then((value: any) => {
      return value?.district_name;
    });
  }

  updateBulkEdit(user: User, shop: any, shop_ids: any): Observable<string> {
    let response: Subject<string> = new Subject();

    let request = {
      USER_ID: user.user_id,
      USER_PHR_ROLE: user.phr_role,
      USER_FACILITY_ID: user.facility_id,
      SHOP_DATA: shop,
      SHOP_IDS: shop_ids
    };

    this._http
      .post<any>(`admin_api_bulk_shop_update`, request)
      .subscribe(
        (value)=>{
          response.next(value.status);
        }
      )
    return response;  
  }   

  async getRevVillageName(Id: string): Promise<string> {
    return await this._dataService.db.revVillages.get(Id).then((value: any) => {
      return value?.rev_village_name;
    });
  }

}