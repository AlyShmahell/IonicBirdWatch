import { Component } from '@angular/core';
import { Plugins, CameraResultType, CameraSource, CameraDirection } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
})
export class CameraPage {

  photo: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/image-outline.png');
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
    }
    catch (e) {
      console.log('cancelled')
    }
  }
  reset(event) {
    console.log(event);
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl('assets/img/image-outline.png');
  }

  type = [];
  typeChange(val) {
    console.log(this.type)
  }

  species = [];
  speciesChange(val) {
    console.log(this.species)
  }

  notes: any;
  notesChange(val) {
    console.log(this.notes)
  }
}
