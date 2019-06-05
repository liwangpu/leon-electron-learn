import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppCacheService, AppConfigService } from '@app/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Md5 } from 'ts-md5';

@Component({
  selector: 'public-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  rememberLogin: boolean = true;
  returnUrl: string;
  loginForm: FormGroup;
  constructor(protected acr: ActivatedRoute, protected router: Router, protected formBuilder: FormBuilder, protected cacheSrv: AppCacheService, protected httpClient: HttpClient) {
    this.loginForm = this.formBuilder.group({
      server: ['', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.acr.queryParams.subscribe(params => this.returnUrl = params['return']);
  }//constructor

  ngOnInit() {
    let lastLoginStr = this.cacheSrv.lastLoginAccount;
    if (lastLoginStr)
      this.loginForm.patchValue(JSON.parse(lastLoginStr));
  }//ngOnInit

  login() {
    let unMd5Password: string;
    let data = this.loginForm.value;
    unMd5Password = data.password;
    data.password = Md5.hashStr(data.password).toString();
    var header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.httpClient.post<{ token: string, expires: string }>(`${data.server}/basic/tokens`, data, { headers: header }).subscribe(res => {
      this.cacheSrv.tokenExpires = res.expires;
      this.cacheSrv.token = res.token;
      this.cacheSrv.server = data.server;
      if (!this.rememberLogin) {
        data.password = '';
      }
      else {
        data.password = unMd5Password;
      }
      this.cacheSrv.lastLoginAccount = JSON.stringify(data);
      this.router.navigateByUrl(this.returnUrl);
    });
  }//login


}
