import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Facility } from 'src/app/models/facility';
import { User } from 'src/app/models/user';
import { FacilityService } from '../service/facility.service';

export class FacilityDataSource extends DataSource<any> {
    // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  public facilitiesSubject = new BehaviorSubject<Facility[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private FacilityService: FacilityService) {
    super();
  }

  loadFacilities(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
    // use pipe operator to chain functions with Observable type
    console.log("inside load facilities")
    this.FacilityService
      .getFacilities(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => console.log('facility-datasource | Get facilities complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('facility-datasource | result in load facilities:', result);
        this.facilitiesSubject.next(result.data);
        if(result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
        } else {
            this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<Facility[]> {
    console.log('facility-datasource | Connecting data source');
    return this.facilitiesSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.facilitiesSubject.complete();
    this.countSubject.complete();
  }
}