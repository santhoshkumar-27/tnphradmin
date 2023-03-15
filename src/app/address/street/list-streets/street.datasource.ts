import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Street } from 'src/app/models/street';
import { User } from 'src/app/models/user';
import { StreetService } from '../service/street.service';

export class StreetDataSource extends DataSource<any> {
    // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  public streetsSubject = new BehaviorSubject<Street[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private streetService: StreetService) {
    super();
  }

  loadStreets(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
    // use pipe operator to chain functions with Observable type
    this.streetService
      .getStreets(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => console.log('street-datasource | Get Streets complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('street-datasource | result in load Streets:', result);
        this.streetsSubject.next(result.data);
        if(result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
        } else {
            this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<Street[]> {
    console.log('street-datasource | Connecting data source');
    return this.streetsSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.streetsSubject.complete();
    this.countSubject.complete();
  }
}