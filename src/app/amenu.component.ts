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
  constructor(private menu: MenuController) {
  }
  async openMenu() {
    if (! await this.menu.isEnabled()){
      this.menu.enable(true, 'menu');
    }
    if (! await this.menu.isOpen()){
      await this.menu.open();
    }
  }
  async closeMenu() {
    if (await this.menu.isOpen())
    {
      await this.menu.close()
    }
    if (await this.menu.isEnabled())
    {
      await this.menu.enable(false);
    }
  }
}