import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Village } from 'src/app/models/village';
import { User } from 'src/app/models/user';
import { VillageService } from '../service/village.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export class VillageDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private villagesSubject = new BehaviorSubject<Village[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private villageService: VillageService, private _snackBar: MatSnackBar,) {
    super();
  }

  loadVillages(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
      console.log("--------Load village called,", filters);
    // use pipe operator to chain functions with Observable type
    this.villageService
      .getVillages(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => {
          console.log('Failed to load data.');
          this._snackBar.open('Failed to fetch records', 'Dismiss', {
          duration: 4000,
        });
          return of([]);
        }),
        finalize(() => console.log('village-datasource | Get villages complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('village-datasource | result in load Villages:', result);
        this.villagesSubject.next(result.data);
        if(result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
        } else {
            this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<Village[]> {
    console.log('village-datasource | Connecting data source');
    return this.villagesSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.villagesSubject.complete();
    this.countSubject.complete();
  }
}
