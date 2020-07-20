import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import axios from 'axios';
import { Router } from "@angular/router";
import { SQLiteProvider } from './sqlite.provider';


@Component({
  selector: 'app-menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss'],
})


@Injectable({
  providedIn: 'root'
})


export class AppMenu {
  constructor(private menu: MenuController, public toastController: ToastController, private router: Router, private db: SQLiteProvider) {
  }
  async openMenu() {
    if (! await this.menu.isEnabled()) {
      this.menu.enable(true, 'menu');
    }
    if (! await this.menu.isOpen()) {
      await this.menu.open();
    }
  }
  async closeMenu() {
    if (await this.menu.isOpen()) {
      await this.menu.close()
    }
    if (await this.menu.isEnabled()) {
      await this.menu.enable(false);
    }
  }
  signout(event) {
    this.closeMenu();
    (async () => {
      await this.db.dbInstance.executeSql(`UPDATE auth SET status=false`);
    })();
    var auth: any;
    axios.delete(
      `http://127.0.0.1:5001/auth`,
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Authorization": `Bearer ${document.cookie}`,
          "X-Requested-With": "XMLHttpRequest",
          "Content-Type": "application/json"
        },
        withCredentials: true
      }
    ).then(
      async (resp) => {
        auth = resp;
        if (auth.data.message != undefined) {
          if (auth.data.message === "success") {
            await this.toast(auth.data.message, "green");
          }
        }
      }
    ).catch(
      async (err) => {
        await this.toast("was not logged in", "red");
        this.router.navigate(["signin"]);
      }
    )


  }
  async toast(message, color) {
    const toast = await this.toastController.create({
      message: message,
      color: color,
      duration: 2000
    });
    toast.present();
  }
}