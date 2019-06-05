import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

@Component({
  selector: 'morejee-simple-confirm-dialog',
  templateUrl: './simple-confirm-dialog.component.html',
  styleUrls: ['./simple-confirm-dialog.component.scss']
})
export class SimpleConfirmDialogComponent implements OnInit, OnDestroy {


  message: string;
  confirm = new Subject();
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SimpleConfirmDialogComponent>) {
    this.message = this.data ? this.data.message : "如果你看见我说明message参数没有传递给我";
  }//constructor

  ngOnInit() {

  }//ngOnInit

  ngOnDestroy(): void {
    this.confirm.complete();
    this.confirm.unsubscribe();
  }//ngOnDestroy

  _onConfirm() {

  }//_onConfirm
}
