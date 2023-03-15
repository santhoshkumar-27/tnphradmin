import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiStreetsUiComponent } from './multi-streets-ui.component';

describe('MultiStreetsUiComponent', () => {
  let component: MultiStreetsUiComponent;
  let fixture: ComponentFixture<MultiStreetsUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiStreetsUiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiStreetsUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
