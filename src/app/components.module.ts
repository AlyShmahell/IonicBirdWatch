import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import { HttpClient } from "@angular/common/http";
import { SlideDrawerComponent } from './slide-drawer.component';
import { fMapComponent } from './fmap.component';
import { InfListComponent } from './inflist.component';
import { Safe } from './safe.component';
import {AppToolBar} from './atoolbar.component';
import {AppMenu} from './amenu.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [SlideDrawerComponent, fMapComponent, InfListComponent, Safe, AppToolBar, AppMenu],
  imports: [
    CommonModule,
    HttpClientModule,
    IonicModule,
    RouterModule
  ],
  providers: [
    HttpClient
  ],
  exports: [SlideDrawerComponent, fMapComponent, InfListComponent, Safe, AppToolBar, AppMenu]
})
export class ComponentsModule { }
