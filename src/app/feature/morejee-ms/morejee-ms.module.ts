import { NgModule } from "@angular/core";
import { FileassetService } from "./services/fileasset.service";
import { SrcClientAssetService } from "./services/src-client-asset.service";


@NgModule({
  providers: [
    FileassetService,
    SrcClientAssetService
  ]
})
export class MorejeeMsModule { }
