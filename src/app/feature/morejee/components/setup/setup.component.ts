import { Component, OnInit } from '@angular/core';
import { AppCacheService } from '@app/core';
import { Router } from '@angular/router';

@Component({
  selector: 'morejee-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  constructor(protected cacheSrv: AppCacheService, protected router: Router) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  logout() {
    this.cacheSrv.token = '';
    this.cacheSrv.tokenExpires = '';
    this.router.navigateByUrl("/public/login");
  }//logout
}
