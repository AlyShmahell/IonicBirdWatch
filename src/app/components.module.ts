import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import { HttpClient } from "@angular/common/http";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DrawerComponent } from './drawer.component';
import { fMapComponent } from './map.component';
import { EntitiesComponent } from './entities.component';
import { Safe } from './safe.component';
import {AppToolBar} from './toolbar.component';
import {AppMenu} from './menu.component';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [DrawerComponent, fMapComponent, EntitiesComponent, Safe, AppToolBar, AppMenu],
  imports: [
    FormsModule,
    CommonModule,
    HttpClientModule,
    IonicModule,
    RouterModule,
    FontAwesomeModule
  ],
  providers: [
    HttpClient
  ],
  exports: [DrawerComponent, fMapComponent, EntitiesComponent, Safe, AppToolBar, AppMenu]
})
export class ComponentsModule { }
