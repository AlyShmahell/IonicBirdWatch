import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import axios from 'axios';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  photo: SafeResourceUrl;
  data: any;

  constructor(private sanitizer: DomSanitizer, private router: Router, public toastController: ToastController) {
    this.reset(undefined);
  }
  ngOnInit() {
    this.reset(undefined);
  }
  reset(event) {
    console.log(event);
    this.data = {
      "fullname": "",
      "website": "",
      "bio": ""
    };
    axios.get(
      `http://127.0.0.1:5001/auth/profile`,
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
        if (resp.status === 200) {
          this.data = {
            'fullname': resp.data.data.fullname,
            "website": resp.data.data.website,
            "bio": resp.data.data.bio,
            "photo": resp.data.data.photo
          }
          if (this.data.photo != null && this.data.photo != "") {
            console.log('op1');
            this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.photo);
          }
          else {
            console.log('op2');
            this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/person.png');
          }

        }
      }
    ).catch(
      async (err) => {
        await this.toast("something went wrong while loading profile data", "red");
      }
    )
  }

  submit(category) {
    var data = { 'value': this.data[category] }
    var res: any;
    axios.put(
      `http://127.0.0.1:5001/auth/profile/${category}`,
      data,
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
        res = resp;
        console.log(res);
        if (res.data.message != undefined) {
          if (res.data.message === "success") {
            await this.toast(`${category} was updated successfully`, "green");
          }
        }
      }
    ).catch(
      async (err) => {
        await this.toast(`could not update ${category}`, "red");
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

  commitfullname(val) {
    this.submit('fullname');
  }

  commitWebsite(val) {
    this.submit('website');
  }

  commitBio(val) {
    this.submit('bio');
  }
}

