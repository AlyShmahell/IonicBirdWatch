import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'camera', pathMatch: 'full' },
  { path: 'map', loadChildren: () => import('./map.module').then( m => m.MapPageModule)},
  { path: 'camera', loadChildren: () => import('./camera.module').then( m => m.CameraPageModule) },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
