import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentSignUpDetailPage } from './current-sign-up-detail.page';

describe('CurrentSignUpDetailPage', () => {
  let component: CurrentSignUpDetailPage;
  let fixture: ComponentFixture<CurrentSignUpDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrentSignUpDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrentSignUpDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
