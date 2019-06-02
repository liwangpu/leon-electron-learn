import { NgModule, Optional, ModuleWithProviders, SkipSelf } from '@angular/core';
import { ElectronService } from './services/electron.service';


@NgModule({
  declarations: [],
  providers: [ElectronService]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('根模块使用forRoot引用,其他模块不需要再引用了!');
    }
  }//constructor

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule
    };
  }//forRoot
}
