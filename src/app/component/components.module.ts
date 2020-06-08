import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import { SlideDrawerComponent } from './slide-drawer/slide-drawer.component';
import { fMapComponent } from './fmap/fmap.component';
import { InfListComponent } from './inflist/inflist.component';



@NgModule({
  declarations: [SlideDrawerComponent, fMapComponent, InfListComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    IonicModule
  ],
  exports: [SlideDrawerComponent, fMapComponent, InfListComponent]
})
export class ComponentsModule { }
