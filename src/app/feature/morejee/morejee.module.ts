import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
//mat modules
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MorejeeRoutingModule } from './morejee-routing.module';
import { AssetUploaderComponent } from './components/asset-uploader/asset-uploader.component';
import { TextureToMaterialComponent } from './components/texture-to-material/texture-to-material.component';
import { AssetUploaderCandeactiveService } from './services/asset-uploader-candeactive.service';
import { SimpleConfirmDialogComponent } from './components/simple-confirm-dialog/simple-confirm-dialog.component';
import { SimpleMessageDialogComponent } from './components/simple-message-dialog/simple-message-dialog.component';
import { SetupComponent } from './components/setup/setup.component';
import { MorejeeMsModule } from '@app/morejee-ms';


@NgModule({
  declarations: [AssetUploaderComponent, TextureToMaterialComponent, SimpleConfirmDialogComponent, SimpleMessageDialogComponent, SetupComponent],
  imports: [
    CommonModule,
    MorejeeMsModule,
    TranslateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MorejeeRoutingModule
  ],
  providers: [
    AssetUploaderCandeactiveService
  ],
  entryComponents: [
    SimpleConfirmDialogComponent,
    SimpleMessageDialogComponent
  ]
})
export class MorejeeModule { }
