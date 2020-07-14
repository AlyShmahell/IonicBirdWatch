import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FiltersPage } from './filters.page';
import { ComponentsModule } from './components.module';
import {IonTagsInputModule} from "./ionic-tags-input";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    IonTagsInputModule,
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    FontAwesomeModule,
    RouterModule.forChild([
      {
        path: '',
        component: FiltersPage
      }
    ])
  ],
  declarations: [FiltersPage]
})
export class FiltersPageModule {}
