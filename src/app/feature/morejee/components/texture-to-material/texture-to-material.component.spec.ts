import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextureToMaterialComponent } from './texture-to-material.component';

describe('TextureToMaterialComponent', () => {
  let component: TextureToMaterialComponent;
  let fixture: ComponentFixture<TextureToMaterialComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextureToMaterialComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextureToMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
