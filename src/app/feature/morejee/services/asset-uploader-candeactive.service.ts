import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AssetUploaderComponent } from '../components/asset-uploader/asset-uploader.component';
import { Observable } from 'rxjs';

@Injectable()
export class AssetUploaderCandeactiveService implements CanDeactivate<AssetUploaderComponent> {

  constructor() { }

  canDeactivate(component: AssetUploaderComponent, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (component._uploadingProcess)
      component.confirmLeaveUploader();
    return !component._uploadingProcess;
  }//canDeactivate
}
