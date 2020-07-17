import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { SQLite } from '@ionic-native/sqlite/ngx';
import {HttpClientModule} from '@angular/common/http';
import { HttpClient } from "@angular/common/http";
import {IonTagsInputModule} from "./ionic-tags-input";
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'


@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [IonTagsInputModule, BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FontAwesomeModule],
  providers: [
    Geolocation,
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SQLite,
    HttpClient
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) { 
		library.addIconPacks(fas, fab, far);
	}
}
