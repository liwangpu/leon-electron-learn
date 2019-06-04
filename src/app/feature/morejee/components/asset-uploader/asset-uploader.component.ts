import { Component, OnInit } from '@angular/core';
import { ElectronDialogService, MessageCenterService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
class AssetList {
  dataMap: { [key: string]: DataMap };
  dependencies: { [key: string]: DataMap };
}

class DataMap {
  package: string;
  name: string;
  class: string;
  tags: object;
  dependencies: { [key: string]: AssetDependency }
}

class AssetDependency {
  package: string;
  name: string;
  class: string;
  level: number;
  localPath: string;
  fileAssetId: string;
  objId: string;
}

@Component({
  selector: 'morejee-asset-uploader',
  templateUrl: './asset-uploader.component.html',
  styleUrls: ['./asset-uploader.component.scss']
})
export class AssetUploaderComponent implements OnInit {

  _projectDir = "";

  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  selectProjectDir() {
    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    this._projectDir = dirs[0];
    let assetListPath = path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt");
    fs.exists(assetListPath, exist => {
      if (!exist) {
        this.messageSrv.message("message.cannotFindAssetListFile");
        return;
      };
      this.analyzeAssetFromConfig(assetListPath);
    });
    console.log('assetListPath', assetListPath);
  }//selectProjectDir

  analyzeAssetFromConfig(assetListPath: string) {
    // fs.readFile(assetListPath, { encoding: 'utf8' }, (err, data) => {
    //   if (err) return;
    //   // let sss=JSON.parse(data); 
    //   console.log(111, data);
    // });
    fsExtra.readJSON(assetListPath, { encoding: 'utf8' }, (err, obj) => {
      console.log(111, err, obj);
    });
  }//analyzeAssetFromConfig


}
