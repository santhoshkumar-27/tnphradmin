import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { District } from 'src/app/models/district';
import { User } from 'src/app/models/user';
import { DistrictService } from '../service/district.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export class DistrictDataSource extends DataSource<any> {
    // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private districtsSubject = new BehaviorSubject<District[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private districtService: DistrictService, private _snackBar: MatSnackBar,) {
    super();
  }

  loadDistricts(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
      console.log("--------Load district called,", filters);
    // use pipe operator to chain functions with Observable type
    this.districtService
      .getDistricts(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => {
          console.log('Failed to load data.');
          this._snackBar.open('Failed to fetch records', 'Dismiss', {
          duration: 4000,
        });
          return of([]);
        }),
        finalize(() => console.log('district-datasource | Get Taluks complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('district-datasource | result in district:', result);
        this.districtsSubject.next(result.data);
        if(result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
        } else {
            this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<District[]> {
    console.log('district-datasource | Connecting data source');
    return this.districtsSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.districtsSubject.complete();
    this.countSubject.complete();
  }
}
