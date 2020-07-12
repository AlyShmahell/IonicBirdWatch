import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CameraPage } from './camera.page';
import { ComponentsModule } from './components.module';
import {IonTagsInputModule} from "./ionic-tags-input";

@NgModule({
  imports: [
    IonTagsInputModule,
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild([
      {
        path: '',
        component: CameraPage
      }
    ])
  ],
  declarations: [CameraPage]
})
export class CameraPageModule {}
