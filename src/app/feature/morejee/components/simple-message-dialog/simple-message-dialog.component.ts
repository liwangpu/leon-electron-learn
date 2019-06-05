import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'morejee-simple-message-dialog',
  templateUrl: './simple-message-dialog.component.html',
  styleUrls: ['./simple-message-dialog.component.scss']
})
export class SimpleMessageDialogComponent implements OnInit {

  message: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<SimpleMessageDialogComponent>) {
    this.message = this.data ? this.data.message : "如果你看见我说明message参数没有传递给我";
  }//constructor

  ngOnInit() {

  }//ngOnInit

}
