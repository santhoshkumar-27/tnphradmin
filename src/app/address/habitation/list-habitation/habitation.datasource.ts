import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HABITATION } from 'src/app/models/habitation';
import { User } from 'src/app/models/user';
import { HabitationService } from '../service/habitation.service';

export class HabitationDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  public habitationSubject = new BehaviorSubject<HABITATION[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private habitationService: HabitationService) {
    super();
  }

  loadHabitations(
    user: User,
    filters: any,
    pageIndex: number,
    pageSize: number,
    callback: Function = () => {}
  ) {
    // use pipe operator to chain functions with Observable type
    this.habitationService
      .getHabitations(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => console.log('Get Habitations complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if (callback) {
          callback();
        }
        console.log('result in load habitations:', result);
        this.habitationSubject.next(result.data);
        this.countSubject.next(result['meta-data'].total_records_count);
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<HABITATION[]> {
    console.log('Connecting data source');
    return this.habitationSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.habitationSubject.complete();
    this.countSubject.complete();
  }
}
