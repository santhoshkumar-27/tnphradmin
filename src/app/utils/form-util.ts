import { FormGroup, Validators } from '@angular/forms';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';

export function resetFormList(
  form: FormGroup,
  formFieldName: string,
  objectKey: string,
  objectList: Array<any>,
  isMandatory: boolean,
  fieldValue: any = ''
) {
  form.get(formFieldName)?.clearValidators();
  if (isMandatory) {
    form
      .get(formFieldName)
      ?.setValidators([
        optionObjectObjectValidator(objectList, objectKey),
        Validators.required,
      ]);
  } else {
    form
      .get(formFieldName)
      ?.setValidators([optionObjectObjectValidator(objectList, objectKey)]);
  }
  form.get(formFieldName)?.setValue(fieldValue);
  form.get(formFieldName)?.updateValueAndValidity();
}
