import { NgModule } from "@angular/core";
import { FileassetService } from "./services/fileasset.service";
import { SrcClientAssetService } from "./services/src-client-asset.service";
import { MapService } from "./services/map.service";


@NgModule({
  providers: [
    FileassetService,
    SrcClientAssetService,
    MapService
  ]
})
export class MorejeeMsModule { }
