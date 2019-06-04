import { Injectable } from '@angular/core';
import { remote, Dialog } from "electron";

@Injectable()
export class ElectronDialogService {

  private _dialog: Dialog;
  constructor() {
    this._dialog = remote.dialog;
  }//constructor

  showOpenDialog(option?: object): string[] {
    return this._dialog.showOpenDialog(option);
  }//showOpenDialog

}
