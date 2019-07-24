import { NgModule } from "@angular/core";
import { FileassetService } from "./services/fileasset.service";
import { SrcClientAssetService } from "./services/src-client-asset.service";
import { MapService } from "./services/map.service";
import { TextureService } from "./services/texture.service";
import { MaterialService } from "./services/material.service";
import { StaticMeshService } from "./services/static-mesh.service";
import { IconService } from "./services/icon.service";


@NgModule({
  providers: [
    FileassetService,
    SrcClientAssetService,
    MapService,
    TextureService,
    MaterialService,
    StaticMeshService,
    IconService
  ]
})
export class MorejeeMsModule { }
