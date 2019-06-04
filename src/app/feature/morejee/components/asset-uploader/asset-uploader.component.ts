import { Component, OnInit } from '@angular/core';
import { ElectronDialogService } from '@app/core';

@Component({
  selector: 'morejee-asset-uploader',
  templateUrl: './asset-uploader.component.html',
  styleUrls: ['./asset-uploader.component.scss']
})
export class AssetUploaderComponent implements OnInit {

  _projectDir="";
  constructor(protected electDialogSrv: ElectronDialogService) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  selectProjectDir() {
    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (dirs && dirs.length > 0)
      this._projectDir = dirs[0];
  }//selectProjectDir
}
