import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreetBulkEditDialogComponent } from './street-bulk-edit-dialog.component';

describe('StreetBulkEditDialogComponent', () => {
  let component: StreetBulkEditDialogComponent;
  let fixture: ComponentFixture<StreetBulkEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StreetBulkEditDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StreetBulkEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
