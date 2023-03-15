import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ShopService } from '../service/shop.service';
import { Shop } from '../../../models/shop';
import { catchError, finalize } from 'rxjs/operators';
import { User } from 'src/app/models/user';

export class ShopDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  public shopsSubject = new BehaviorSubject<Shop[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private shopService: ShopService) {
    super();
  }

  loadShops(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
    // use pipe operator to chain functions with Observable type
    this.shopService
      .getShops(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => console.log('Get shops complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('result in load shops:', result);
        this.shopsSubject.next(result.data);
        this.countSubject.next(result['meta-data'].total_records_count);
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<Shop[]> {
    console.log('Connecting data source');
    return this.shopsSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.shopsSubject.complete();
    this.countSubject.complete();
  }
}
