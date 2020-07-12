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
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/person.png');
    this.data = {
      "password": "",
      "photo" : ""
    };
  }
  ngOnInit() {
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
      console.log(image.dataUrl);
      this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl));
      this.data.photo = image && (image.dataUrl);
    }
    catch (e) {
      console.log('cancelled')
    }
  }
  uncapture(){
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/person.png');
    this.data.photo = "";
  }
  reset(event) {
    console.log(event);
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/person.png');
    this.data = {
      "password": "",
      "photo" : ""
    };
  }

  submit() {
    console.log(this.data);
    var res: any;
    axios.post(
      `http://127.0.0.1:5001/auth/wildlife`,
      this.data,
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
            await this.toast(res.data.message, "green");
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

  commitPassword(val) {
    console.log(this.data.password)
  }

}
