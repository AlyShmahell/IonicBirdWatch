import { Component, OnInit } from '@angular/core';
import { Plugins, CameraResultType, CameraSource, CameraDirection } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import axios from 'axios';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.page.html',
  styleUrls: ['./manage.page.scss'],
})
export class ManagePage implements OnInit {

  photo: SafeResourceUrl;
  data: any;

  constructor(private sanitizer: DomSanitizer, private router: Router, public toastController: ToastController) {
    this.reset(undefined);
  }
  ngOnInit() {
    this.reset(undefined);
  }
  reset(event) {
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
            "photo": resp.data.data.photo,
            "password": ""
          }
          if (this.data.photo != null && this.data.photo != "") {
            this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.photo);
          }
          else {
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
  async capture() {
    try {
      const image = await Plugins.Camera.getPhoto({
        quality: 100,
        allowEditing: false,
        direction: CameraDirection.Rear,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl));
      this.data.photo = image && (image.dataUrl);
      this.commitPhoto(undefined);
    }
    catch (e) {
      console.log('cancelled')
    }
  }
  uncapture() {
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/person.png');
    this.data.photo = "";
    this.commitPhoto(undefined);
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

  commitPassword(val) {
    if (this.data.password != "")
      this.submit('password');
  }
  commitPhoto(val) {
    this.submit('photo');
  }

}
