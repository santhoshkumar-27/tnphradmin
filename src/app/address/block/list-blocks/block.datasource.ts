import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Block } from 'src/app/models/block';
import { User } from 'src/app/models/user';
import { BlockService } from '../service/block.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export class BlockDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  private blocksSubject = new BehaviorSubject<Block[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private blockService: BlockService, private _snackBar: MatSnackBar,) {
    super();
  }

  loadBlocks(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
      console.log("--------Load block called,", filters);
    // use pipe operator to chain functions with Observable type
    this.blockService
      .getBlocks(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => {
          console.log('Failed to load data.');
          this._snackBar.open('Failed to fetch records', 'Dismiss', {
          duration: 4000,
        });
          return of([]);
        }),
        finalize(() => console.log('block-datasource | Get Blocks complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        if(callback) {
          callback();
        }
        console.log('block-datasource | result in load Blocks:', result);
        this.blocksSubject.next(result.data);
        if(result['meta-data']) {
            this.countSubject.next(result['meta-data'].total_records_count);
        } else {
            this.countSubject.next(0);
        }
      });
  }

  connect(collectionViewer: CollectionViewer): Observable<Block[]> {
    console.log('block-datasource | Connecting data source');
    return this.blocksSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.blocksSubject.complete();
    this.countSubject.complete();
  }
}