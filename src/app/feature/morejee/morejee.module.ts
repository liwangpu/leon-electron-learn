import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MorejeeRoutingModule } from './morejee-routing.module';
import { MainComponent } from './components/main/main.component';

@NgModule({
  declarations: [MainComponent],
  imports: [
    CommonModule,
    MorejeeRoutingModule
  ]
})
export class MorejeeModule { }
