import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignRequestFinalPage } from './sign-request-final.page';

describe('SignRequestFinalPage', () => {
  let component: SignRequestFinalPage;
  let fixture: ComponentFixture<SignRequestFinalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignRequestFinalPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignRequestFinalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
