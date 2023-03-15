import { FormGroup } from '@angular/forms';

export function isUnallocated(form: FormGroup): boolean {
  let isUnallocate: boolean =
    // checking unallocated in district dropdown
    form
      .get('district')
      ?.value?.district_name?.toLowerCase()
      .includes('unallocated') ||
    // in hud dropdowm
    form.get('hud')?.value?.hud_name?.toLowerCase().includes('unallocated') ||
    // in taluk dropdown
    form
      .get('taluk')
      ?.value?.taluk_name?.toLowerCase()
      .includes('unallocated') ||
    // in block dropdown
    form
      .get('block')
      ?.value?.block_name?.toLowerCase()
      .includes('unallocated') ||
    // in village dropdown
    form
      .get('village')
      ?.value?.village_name?.toLowerCase()
      .includes('unallocated') ||
    // in habitation dropdown
    form
      .get('habitation')
      ?.value?.habitation_name?.toLowerCase()
      .includes('unallocated') ||
    // in streets dropdown
    form
      .get('street_name')
      ?.value?.street_name?.toLowerCase()
      .includes('unallocated') ||
    // in facility dropdown
    form
      .get('facility')
      ?.value?.facility_name?.toLowerCase()
      .includes('unallocated');

  return isUnallocate;
}

export function disableEdit(name: string): boolean {
  //if the name includes unallocated then disable edit icon
  return name?.toLowerCase().includes('unallocated') ? true : false;
}
