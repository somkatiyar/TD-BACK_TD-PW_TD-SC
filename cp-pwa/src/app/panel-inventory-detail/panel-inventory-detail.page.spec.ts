import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelInventoryDetailPage } from './panel-inventory-detail.page';

describe('PanelInventoryDetailPage', () => {
  let component: PanelInventoryDetailPage;
  let fixture: ComponentFixture<PanelInventoryDetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PanelInventoryDetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelInventoryDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
