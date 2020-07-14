import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource, CameraDirection } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import axios from 'axios';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
})
export class CameraPage {

  photo: SafeResourceUrl;
  data: any;
  center: any;

  constructor(private sanitizer: DomSanitizer, private geolocation: Geolocation, private http: HttpClient, private router: Router, public toastController: ToastController) {
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/icon.png');
    this.data = {
      "photo": "",
      "type": "",
      "species": "",
      "notes": "",
      "lon": "",
      "lat": "",
      "date": ""
    };
    this.center = [0, 0];
  }
  ngOnInit() {
    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      this.center = [data.coords.longitude, data.coords.latitude];
    });
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
    }
    catch (e) {
      console.log('cancelled')
    }
  }
  reset(event) {
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/icon.png');
    this.data = {
      "photo": "",
      "type": "",
      "species": "",
      "notes": "",
      "lon": "",
      "lat": "",
      "date": ""
    };
    this.center = [0, 0];
  }

  submit() {
    var empty = [];
    for (var key in this.data){
      if(this.data[key] === "")
      {
        if ("photo type species notes".indexOf(key) > -1)
        {
          empty.push(key);
        }
      }
    }
    if (empty.length > 0)
    {
      this.toast("empty fields: "+empty.join(", "), "red");
      return;
    }
    var date = new Date().toISOString();
    this.data.date = date;
    this.data.lon = this.center[0];
    this.data.lat = this.center[1];
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
        if (res.data.message != undefined) {
          if (res.data.message === "success") {
            await this.toast(res.data.message, "green");
            this.router.navigate(['/map']);
          }
        }
      }
    ).catch(
      async (err) => {
        await this.toast("photo already exists", "red");
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
