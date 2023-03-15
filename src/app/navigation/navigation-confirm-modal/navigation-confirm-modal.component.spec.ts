import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationConfirmModalComponent } from './navigation-confirm-modal.component';

describe('NavigationConfirmModalComponent', () => {
  let component: NavigationConfirmModalComponent;
  let fixture: ComponentFixture<NavigationConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavigationConfirmModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
