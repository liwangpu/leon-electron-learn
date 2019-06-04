import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
//mat modules
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MorejeeRoutingModule } from './morejee-routing.module';
import { AssetUploaderComponent } from './components/asset-uploader/asset-uploader.component';
import { TextureToMaterialComponent } from './components/texture-to-material/texture-to-material.component';

@NgModule({
  declarations: [AssetUploaderComponent, TextureToMaterialComponent],
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MorejeeRoutingModule
  ]
})
export class MorejeeModule { }
