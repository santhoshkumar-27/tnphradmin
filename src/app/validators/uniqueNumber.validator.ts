import { AbstractControl, ValidationErrors } from '@angular/forms';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, take } from 'rxjs/operators';
import { User } from '../models/user';
import { ValidationApiService } from '../starter/services/validation.service';

export class ValidateUniqueMoileNumber {
  public static checkMobile(serive: ValidationApiService, user: User, isEdit: boolean, editUser: User) {
    return (group: AbstractControl): Observable<ValidationErrors | null> => {
      let mobile_number = group.get('mobile_number')?.value;
      if( !mobile_number || (isEdit && +mobile_number === editUser.mobile_number)) {
          return of(null);
      }

      return serive
        .getUserWithMobileNumber(mobile_number, user)
        .pipe(
          debounceTime(200),
          distinctUntilChanged(),
          take(1),
          map((result: any) => {
            console.log('checkExisting api called', result);
            let records = result.data as Array<any>;
            return records.length ? { number_exists: true, number_exists_facility: records[0].facility_name } : null;
          })
        );
    };
  }
}
