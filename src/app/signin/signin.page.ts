import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import axios from 'axios';

import { SQLiteProvider } from '../sqlite.provider';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {

  signin = {};
  auth: any;
  constructor(private router: Router, public toastController: ToastController, private db: SQLiteProvider) { }

  ngOnInit() {
  }
  processForm(event) {
    axios.post(
      `http://127.0.0.1:5001/auth`,
      this.signin,
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
      async (resp)=>{
        this.auth = resp;
        if (this.auth.data.message != undefined) {
          if (this.auth.data.message === "success"){
            await this.toast(this.auth.data.message, "green");
              await this.db.dbInstance.executeSql(`INSERT INTO auth (status) VALUES(true)`);
            this.router.navigate(['/map']);
          }
        }
      }
    ).catch(
      async (err) => {
        await this.toast("wrong credentials", "red");
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
