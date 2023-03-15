import { AbstractControl, ValidatorFn } from '@angular/forms';

export function selectedOptionValidator(options: Array<any>): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const val: string = control.value;
    if (val && options.indexOf(val) < 0) {
      //console.log('returning error object');
      // return object with error string and boolean true when validation fails.
      return { Selected_Option_Not_In_List: true };
    }
    // return null if validation pass
    return null;
  };
}

export function selectedOptionObjectValidator(options: Array<{ [name: string]: any }>, objectKey: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const val: string = control.value;
      //console.log('valiator val:', val);
      if (val) {
        let found = options ? options.filter(item => item[objectKey] === val) : [];
        if(found.length) {
            // validation pass.
            return null;
        }
        // return object with error string and boolean true when validation fails.
        return { Selected_Option_Not_In_List: true };
      }
      // return null if validation pass.
      return null;
    };
  }

  export function optionObjectObjectValidator(options: Array<{ [name: string]: any }>, objectKey: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const val: { [name: string]: any } = control.value;
      ////console.log('valiator object val:', val);
      if (val) {
        let found = options ? options.filter(item => item[objectKey] === val[objectKey]) : [];
        if(found.length) {
            // validation pass.
            return null;
        }
        // return object with error string and boolean true when validation fails.
        return { Selected_Option_Not_In_List: true };
      }
      // return null if validation pass.
      return null;
    };
  }

  // to check multi select option values in the array
  export function multiSelectedOptionObjectValidator(options: Array<{ [name: string]: any }>, objectKey: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const val: any = control.value;
      //console.log('valiator val:', val);
      if (val && typeof val == "object") {
        for (var i = 0; i < val.length; i++) {
          let found = options ? options.filter(item => item[objectKey] === val[i][objectKey]) : [];
          if(found.length) {
              // validation pass.
              return null;
          }
          // return object with error string and boolean true when validation fails.
          return { Selected_Option_Not_In_List: true };
        }
      } else {
        return { Selected_Option_Not_In_List: true };
      }
      // return null if validation pass.
      return null;
    };
  }

