import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebViewPage } from './web-view.page';

describe('WebViewPage', () => {
  let component: WebViewPage;
  let fixture: ComponentFixture<WebViewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebViewPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
