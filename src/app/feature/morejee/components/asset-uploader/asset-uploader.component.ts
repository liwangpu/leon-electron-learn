import { Component, OnInit } from '@angular/core';
import { ElectronDialogService } from '@app/core';

@Component({
  selector: 'morejee-asset-uploader',
  templateUrl: './asset-uploader.component.html',
  styleUrls: ['./asset-uploader.component.scss']
})
export class AssetUploaderComponent implements OnInit {

  constructor(protected electDialogSrv: ElectronDialogService) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  selectProjectDir() {
    this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
  }//selectProjectDir
}
