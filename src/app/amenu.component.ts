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

openMenu() {
    this.menu.enable(true, 'menu');
    this.menu.open('menu');
  }
}