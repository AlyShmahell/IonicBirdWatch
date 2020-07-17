import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource, CameraDirection } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import axios from 'axios';
import { SQLiteProvider } from './sqlite.provider';

@Component({
  selector: 'app-add',
  templateUrl: './add.page.html',
  styleUrls: ['./add.page.scss'],
})
export class AddPage {

  photo: SafeResourceUrl;
  data: any;

  constructor(private sanitizer: DomSanitizer, private geolocation: Geolocation, private router: Router, public toastController: ToastController, private db: SQLiteProvider) {
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
      this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl));
      this.data.photo = image && (image.dataUrl);
    }
    catch (e) {
      
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
  }

  submit() {
    this.geolocation.getCurrentPosition({ enableHighAccuracy: false, maximumAge:Infinity }).then((resp) => {

      var empty = [];
      for (var key in this.data) {
        if (this.data[key] === "") {
          if ("photo type species notes".indexOf(key) > -1) {
            empty.push(key);
          }
        }
      }
      if (empty.length > 0) {
        this.toast("empty fields: " + empty.join(", "), "red");
        return;
      }
      var date = new Date().toISOString();
      this.data.date = date;
      this.data.lon = resp.coords.longitude;
      this.data.lat = resp.coords.latitude;
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
              var maxd = new Date();
              maxd.setMonth(maxd.getMonth() - 0);
              var smaxd = maxd.toISOString();
              var mind = new Date();
              mind.setMonth(mind.getMonth() - 100);
              var smind = mind.toISOString();
              await this.db.dbInstance.executeSql(`UPDATE filters SET mind="${smind}", maxd="${smaxd}" WHERE id=1`);
              this.reset(null);
            }
          }
        }
      ).catch(
        async (err) => {
          await this.toast("photo already exists", "red");
        }
      )
    });

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
