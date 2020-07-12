import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from "@angular/common/http";
import { ToastController } from '@ionic/angular';
import axios from 'axios';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  signup = {};
  auth: any;
  constructor(private router: Router, private http: HttpClient, public toastController: ToastController) { }

  ngOnInit() {
  }

  processForm(event) {
    console.log(event);
    console.log(this.signup);
    axios.post(
      `http://127.0.0.1:5001/auth`,
      this.signup,
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
        console.log(this.auth);
        if (this.auth.data.message != undefined) {
          if (this.auth.data.message === "success"){
            await this.toast(this.auth.data.message, "green");
            this.router.navigate(['/map']);
          }
        }
      }
    ).catch(
      async (err) => {
        await this.toast("credentials already exist", "red");
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
