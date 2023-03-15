import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { User } from 'src/app/models/user';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  RevenueVillage,
  RevenueVillageFilters,
} from 'src/app/models/revenue-village';
import { RevenueVillageService } from '../service/revenue-village.service';

export class RevenueVillageDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private revVillageSubject = new BehaviorSubject<RevenueVillage[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(
    private revVillageService: RevenueVillageService,
    private _snackBar: MatSnackBar
  ) {
    super();
  }

  loadRevenueVillages(
    user: User,
    filters: RevenueVillageFilters,
    pageIndex: number,
    pageSize: number,
    callback: Function = () => {}
  ) {
    console.log('--------Load rev village called,', filters);
    // use pipe operator to chain functions with Observable type
    this.revVillageService
      .getRevenueVillages(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => {
          console.log('Failed to load data.');
          this._snackBar.open('Failed to fetch records', 'Dismiss', {
            duration: 4000,
          });
          return of([]);
        }),
        finalize(() =>
          console.log('rev-village-datasource | Get Rev Villages complete')
        )
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if (callback) {
          callback();
        }
        this.revVillageSubject.next(result.data);
        if (result['meta-data']) {
          this.countSubject.next(result['meta-data'].total_records_count);
        } else {
          this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<RevenueVillage[]> {
    return this.revVillageSubject.asObservable();
  }

  disconnect(collectionViewer: CollectionViewer): void {
    this.revVillageSubject.complete();
    this.countSubject.complete();
  }
}
