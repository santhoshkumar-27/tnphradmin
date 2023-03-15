import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopBulkEditComponent } from './shop-bulk-edit.component';

describe('ShopBulkEditComponent', () => {
  let component: ShopBulkEditComponent;
  let fixture: ComponentFixture<ShopBulkEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShopBulkEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShopBulkEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
