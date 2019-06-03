import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MorejeeRoutingModule } from './morejee-routing.module';
import { AssetUploaderComponent } from './components/asset-uploader/asset-uploader.component';
import { TextureToMaterialComponent } from './components/texture-to-material/texture-to-material.component';

@NgModule({
  declarations: [AssetUploaderComponent, TextureToMaterialComponent],
  imports: [
    CommonModule,
    MorejeeRoutingModule
  ]
})
export class MorejeeModule { }
