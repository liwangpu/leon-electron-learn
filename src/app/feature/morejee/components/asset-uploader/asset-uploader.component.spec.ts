import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetUploaderComponent } from './asset-uploader.component';

describe('AssetUploaderComponent', () => {
  let component: AssetUploaderComponent;
  let fixture: ComponentFixture<AssetUploaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AssetUploaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
