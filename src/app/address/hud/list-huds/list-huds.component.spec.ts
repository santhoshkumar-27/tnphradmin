import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListHudsComponent } from './list-huds.component';

describe('ListHudsComponent', () => {
  let component: ListHudsComponent;
  let fixture: ComponentFixture<ListHudsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListHudsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListHudsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
