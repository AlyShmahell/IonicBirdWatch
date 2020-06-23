import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: 'amenu.component.html',
  styleUrls: ['amenu.component.scss'],
})


@Injectable({
  providedIn: 'root'
})
export class AppMenu {

constructor(private menu: MenuController) { }

  openFirst() {
    this.menu.enable(true, 'first');
    this.menu.open('first');
  }

  openEnd() {
    this.menu.open('end');
  }

  openCustom() {
    this.menu.enable(true, 'custom');
    this.menu.open('custom');
  }
}