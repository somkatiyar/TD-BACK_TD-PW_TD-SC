import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupModelPage } from './popup-model.page';

describe('PopupModelPage', () => {
  let component: PopupModelPage;
  let fixture: ComponentFixture<PopupModelPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupModelPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupModelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
