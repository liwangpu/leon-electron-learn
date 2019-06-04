import { Injectable, OnInit } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote, BrowserWindow, ipcMain } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable()
export class ElectronService {


  // ipcRenderer: typeof ipcRenderer;
  // webFrame: typeof webFrame;
  // ipcMain: typeof ipcMain;
  // remote: typeof remote;
  // browserWindow: BrowserWindow;
  // childProcess: typeof childProcess;
  // fs: typeof fs;

  get isElectron(): boolean {
    return window && window.process && window.process.type;
  }

  constructor() {
    // Conditional imports
    // if (this.isElectron) {
    //   this.ipcRenderer = window.require('electron').ipcRenderer;
    //   this.webFrame = window.require('electron').webFrame;
    //   this.remote = window.require('electron').remote;
    //   this.browserWindow = this.remote.getCurrentWindow();
    //   this.ipcMain = this.remote.ipcMain;
    //   this.childProcess = window.require('child_process');
    //   this.fs = window.require('fs');

    //   // console.log(666,window.require("electron").BrowserWindow);

    //   this.ipcMain.on("app-ondragend", () => {
    //     console.log('ipcMain get message');
    //   });
    // }
    // let remote = window.require('electron').remote;
    // let win: BrowserWindow = remote.getCurrentWindow();
    // win.on('maximize', () => {
    //   console.log('you maximize win', new Date());
    // });
  }//constructor


}
