import { Injectable } from '@angular/core';
import * as os from "os";
@Injectable()
export class FileReaderWriterService {

  private _tmpDir: string;

  get tmpDir() {
    return this._tmpDir;
  }

  constructor() {
    this._tmpDir = os.tmpdir();
  }//constructor

  readFile(filePath: string) {

  }//readFile

  writeFile() {

  }//

}
