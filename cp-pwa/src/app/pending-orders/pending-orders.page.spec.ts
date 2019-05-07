import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingOrdersPage } from './pending-orders.page';

describe('PendingOrdersPage', () => {
  let component: PendingOrdersPage;
  let fixture: ComponentFixture<PendingOrdersPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingOrdersPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingOrdersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
