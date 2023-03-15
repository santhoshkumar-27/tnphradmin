import { Injectable } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { of } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { User } from '../models/user';
import { CommonService } from './common.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GidValidatorService {
  constructor(private _service: CommonService) {}

  checkGid(user: User, id: string, type: string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      let gid = control?.value;
      console.log('gid value', gid);
      if (control?.value == '' || control?.value == null || isNaN(+gid)) {
        return of(null);
      }
      return this._service.validateGID(user, id, +gid, type).pipe(
        map((result: any) => {
          let isDuplicate = !result?.data?.allowed;
          return isDuplicate ? { is_duplicate: true } : null;
        })
      );
    };
  }
}
