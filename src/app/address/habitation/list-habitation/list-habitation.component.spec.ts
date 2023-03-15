import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHabitationComponent } from './list-habitation.component';

describe('ListHabitationComponent', () => {
  let component: ListHabitationComponent;
  let fixture: ComponentFixture<ListHabitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListHabitationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListHabitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
