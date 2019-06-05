import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppCacheService } from './app-cache.service';

@Injectable()
export class AuthGuardService implements CanActivate {

  constructor(protected cacheSrv: AppCacheService, protected router: Router) {

  }//constructor

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    let hasToken = this.cacheSrv.token ? true : false;
    let tokenNotExpired = new Date(this.cacheSrv.tokenExpires) > new Date();
    if (hasToken && tokenNotExpired)
      return true;

    let params = {
      queryParams: {
        return: state.url
      }
    };
    this.router.navigate(["/public/login"], params);
    return false;
  }//canActivate
}
