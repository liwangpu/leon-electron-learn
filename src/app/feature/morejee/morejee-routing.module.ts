import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AssetUploaderComponent } from './components/asset-uploader/asset-uploader.component';
import { TextureToMaterialComponent } from './components/texture-to-material/texture-to-material.component';
import { AssetUploaderCandeactiveService } from './services/asset-uploader-candeactive.service';


const routes: Routes = [
  {
    path: 'asset-uploader',
    component: AssetUploaderComponent,
    canDeactivate: [AssetUploaderCandeactiveService]
  }
  , {
    path: 'texture-to-material',
    component: TextureToMaterialComponent
  }
  , { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MorejeeRoutingModule { }
