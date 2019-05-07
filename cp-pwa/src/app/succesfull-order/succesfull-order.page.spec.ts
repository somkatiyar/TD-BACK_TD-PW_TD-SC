import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuccesfullOrderPage } from './succesfull-order.page';

describe('SuccesfullOrderPage', () => {
  let component: SuccesfullOrderPage;
  let fixture: ComponentFixture<SuccesfullOrderPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuccesfullOrderPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuccesfullOrderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
