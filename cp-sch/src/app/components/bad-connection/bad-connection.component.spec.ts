import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BadConnectionComponent } from './bad-connection.component';

describe('BadConnectionComponent', () => {
  let component: BadConnectionComponent;
  let fixture: ComponentFixture<BadConnectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BadConnectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BadConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
