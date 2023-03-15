import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserService } from '../service/user.service';
import { catchError, finalize } from 'rxjs/operators';
import { User } from 'src/app/models/user';

export class UserDataSource extends DataSource<any> {
  // add variables to hold the data and number of total records retrieved asynchronously
  // BehaviourSubject type is used for this purpose
  public usersSubject = new BehaviorSubject<User[]>([]);

  // to show the total number of records
  private countSubject = new BehaviorSubject<number>(0);
  public counter$ = this.countSubject.asObservable();
  constructor(private userService: UserService) {
    super();
  }

  loadUsers(user: User, filters: any, pageIndex: number, pageSize: number, callback : Function = () => {}) {
    // use pipe operator to chain functions with Observable type
    this.userService
      .getUsers(user, filters, pageIndex, pageSize)
      .pipe(
        catchError(() => of([])),
        finalize(() => console.log('Get users complete'))
      )
      // subscribe method to receive Observable type data when it is ready
      .subscribe((result: any) => {
        console.log('result in load users:', result);
        if(callback) {
          callback();
        }
        this.usersSubject.next(result.data);
        this.countSubject.next(result['meta-data'].total_records_count);
      });
  }

  connect(): Observable<User[]> {
    console.log('Connecting data source');
    return this.usersSubject.asObservable();
  }
  disconnect(collectionViewer: CollectionViewer): void {
    this.usersSubject.complete();
    this.countSubject.complete();
  }
}
