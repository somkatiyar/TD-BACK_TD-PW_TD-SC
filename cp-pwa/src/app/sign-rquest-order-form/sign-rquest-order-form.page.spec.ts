import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignRquestOrderFormPage } from './sign-rquest-order-form.page';

describe('SignRquestOrderFormPage', () => {
  let component: SignRquestOrderFormPage;
  let fixture: ComponentFixture<SignRquestOrderFormPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignRquestOrderFormPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignRquestOrderFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
