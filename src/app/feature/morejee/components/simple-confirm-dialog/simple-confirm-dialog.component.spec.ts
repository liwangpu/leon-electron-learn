import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleConfirmDialogComponent } from './simple-confirm-dialog.component';

describe('SimpleConfirmDialogComponent', () => {
  let component: SimpleConfirmDialogComponent;
  let fixture: ComponentFixture<SimpleConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
