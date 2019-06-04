import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { Subject } from 'rxjs';
import { remote, BrowserWindow } from "electron";
@Injectable()
export class BrowserWindowService {

  // private _browserWindowEvents = new Subject<{ topic: string, data?: any }>();
  // browserWindowEvents = this._browserWindowEvents.asObservable();
  private _currentWindow: BrowserWindow;

  get isMaximize(): boolean {
    return this._currentWindow.isMaximized();
  }
  constructor() {
    this._currentWindow = remote.getCurrentWindow();
  }//constructor

  minimize() {
    this._currentWindow.minimize();
  }//minimize

  maximize() {
    this._currentWindow.maximize();
  }//maximize

  unmaximize() {
    this._currentWindow.unmaximize();
  }//unmaximize

  close() {
    this._currentWindow.close();
  }//close
}
