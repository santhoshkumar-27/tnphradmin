import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHudComponent } from './add-hud.component';

describe('AddHudComponent', () => {
  let component: AddHudComponent;
  let fixture: ComponentFixture<AddHudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddHudComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddHudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
