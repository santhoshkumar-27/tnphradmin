import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFacilitiesComponent } from './list-facilities.component';

describe('ListFacilitiesComponent', () => {
  let component: ListFacilitiesComponent;
  let fixture: ComponentFixture<ListFacilitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListFacilitiesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFacilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
