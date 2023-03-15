import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HUD, HUD_FILTERS } from 'src/app/models/hud';
import { User } from 'src/app/models/user';
import { HudService } from '../service/hud.service';

export class HudDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private hudSubject = new BehaviorSubject<HUD[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private hudService: HudService) {
    super();
  }

  loadHuds(
    user: User,
    filters: HUD_FILTERS,
    pageIndex: number,
    pageSize: number,
    callback: Function = () => {}
  ) {
    // use pipe operator to chain functions with Observable type
    this.hudService
      .getHuds(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => console.log('hud-datasource | Get huds complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe(
        (result: any) => {
          if (callback) {
            callback();
          }
          this.hudSubject.next(result.data);
          if (result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
          } else {
            this.countSubject.next(0);
          }
        },
        (err) => {
          if (callback) {
            callback();
          }
          console.log('Error while retrieving hud data', err);
        }
      );
  }

  connect(collectionViewer: CollectionViewer): Observable<HUD[]> {
    console.log('hud-datasource | Connecting data source');
    return this.hudSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.hudSubject.complete();
    this.countSubject.complete();
  }
}
