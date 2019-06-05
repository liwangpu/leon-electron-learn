import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
//mat modules
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MorejeeRoutingModule } from './morejee-routing.module';
import { AssetUploaderComponent } from './components/asset-uploader/asset-uploader.component';
import { TextureToMaterialComponent } from './components/texture-to-material/texture-to-material.component';
import { AssetUploaderCandeactiveService } from './services/asset-uploader-candeactive.service';


@NgModule({
  declarations: [AssetUploaderComponent, TextureToMaterialComponent],
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSnackBarModule,
    MorejeeRoutingModule
  ],
  providers: [
    AssetUploaderCandeactiveService
  ]
})
export class MorejeeModule { }
