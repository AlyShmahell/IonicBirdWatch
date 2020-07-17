import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { AddPage } from './add.page';
import { ComponentsModule } from './components.module';
import {IonTagsInputModule} from "./ionic-tags-input";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    IonTagsInputModule,
    FontAwesomeModule,
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    RouterModule.forChild([
      {
        path: '',
        component: AddPage
      }
    ])
  ],
  declarations: [AddPage]
})
export class AddPageModule {}
