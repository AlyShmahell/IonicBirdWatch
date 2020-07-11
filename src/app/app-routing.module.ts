import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'map', pathMatch: 'full' },
  { path: 'map', loadChildren: () => import('./map.module').then( m => m.MapPageModule)},
  { path: 'camera', loadChildren: () => import('./camera.module').then( m => m.CameraPageModule) },
  { path: 'filters', loadChildren: () => import('./filters.module').then( m => m.FiltersPageModule) },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
