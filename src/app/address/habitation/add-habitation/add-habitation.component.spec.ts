import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHabitationComponent } from './add-habitation.component';

describe('AddHabitationComponent', () => {
  let component: AddHabitationComponent;
  let fixture: ComponentFixture<AddHabitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddHabitationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddHabitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
