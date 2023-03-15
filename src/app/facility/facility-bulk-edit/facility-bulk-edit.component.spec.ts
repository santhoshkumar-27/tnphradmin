import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityBulkEditComponent } from './facility-bulk-edit.component';

describe('FacilityBulkEditComponent', () => {
  let component: FacilityBulkEditComponent;
  let fixture: ComponentFixture<FacilityBulkEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FacilityBulkEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FacilityBulkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
