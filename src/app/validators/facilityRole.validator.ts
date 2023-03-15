import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

export function facilityRoleValidator(): ValidatorFn {
  return (group: AbstractControl): { [key: string]: any } | null => {
    let roleAtFacility = group.get('role_in_facility')?.value;
    let phrRole = group.get('phr_role')?.value;
    console.log('validation - selectedOptionValidator- phrRole:', phrRole, ' ,roleAtFacility:', roleAtFacility);
    if (phrRole && roleAtFacility) {
      if(phrRole.indexOf('ADMIN') > -1 && roleAtFacility === 'User') {
        console.log('-- inside BP 1 ---');
        return { user_not_allwed_for_phr_admin_role: true };
      } else if(phrRole.indexOf('ADMIN') < 0 && roleAtFacility === 'Admin') {
        console.log('-- inside BP 2 ---');
        return { admin_not_allwed_for_phr_user_role: true };
      }
    }
    // return null if validation pass
    return null;
  };
}