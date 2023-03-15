import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Taluk } from 'src/app/models/taluk';
import { User } from 'src/app/models/user';
import { TalukService } from '../service/taluk.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export class TalukDataSource extends DataSource<any> {
    // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private taluksSubject = new BehaviorSubject<Taluk[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private talukService: TalukService, private _snackBar: MatSnackBar,) {
    super();
  }

  loadTaluks(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
      console.log("--------Load taluk called,", filters);
    // use pipe operator to chain functions with Observable type
    this.talukService
      .getTaluks(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => {
          console.log('Failed to load data.');
          this._snackBar.open('Failed to fetch records', 'Dismiss', {
          duration: 4000,
        });
          return of([]);
        }),
        finalize(() => console.log('taluk-datasource | Get Taluks complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('taluk-datasource | result in Taluks:', result);
        this.taluksSubject.next(result.data);
        if(result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
        } else {
            this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<Taluk[]> {
    console.log('taluk-datasource | Connecting data source');
    return this.taluksSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.taluksSubject.complete();
    this.countSubject.complete();
  }
}