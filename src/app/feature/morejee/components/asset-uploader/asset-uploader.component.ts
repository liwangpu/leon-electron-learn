import { Component, OnInit } from '@angular/core';
import { ElectronDialogService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
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

  constructor(protected electDialogSrv: ElectronDialogService) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  selectProjectDir() {
    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    this._projectDir = dirs[0];
    let assetListPath = path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt");
    fs.exists(assetListPath, exist => {
      if (!exist) return;
      this.analyzeAssetFromConfig(assetListPath);
    });
    // this.analyzeAssetFromConfig(assetListPath);
    console.log('assetListPath', assetListPath);
  }//selectProjectDir

  analyzeAssetFromConfig(assetListPath: string) {
    fs.readFile(assetListPath, {encoding: 'utf8'}, (err, data) => {
      if (err) return;
      // let sss=JSON.parse(data); 
      console.log(111, data);
    });
  }//analyzeAssetFromConfig


}
