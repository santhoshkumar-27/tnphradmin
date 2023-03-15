import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListStreetsComponent } from './list-streets.component';

describe('ListStreetsComponent', () => {
  let component: ListStreetsComponent;
  let fixture: ComponentFixture<ListStreetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListStreetsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListStreetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
