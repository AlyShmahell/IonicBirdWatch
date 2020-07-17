import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '', redirectTo: 'signup',
    pathMatch: 'full'
  },
  {
    path: 'map',
    loadChildren: () => import('./home.module').then(m => m.HomePageModule)
  },
  {
    path: 'camera',
    loadChildren: () => import('./add.module').then(m => m.AddPageModule)
  },
  { 
    path: 'filters', 
    loadChildren: () => import('./filters.module').then(m => m.FiltersPageModule) 
  },
  {
    path: 'signin',
    loadChildren: () => import('./signin/signin.module').then(m => m.SigninPageModule)
  },
  {
    path: 'signup',
    loadChildren: () => import('./signup/signup.module').then(m => m.SignupPageModule)
  },
  {
    path: 'privacy',
    loadChildren: () => import('./privacy/privacy.module').then(m => m.PrivacyPageModule)
  },
  {
    path: 'terms',
    loadChildren: () => import('./terms/terms.module').then(m => m.TermsPageModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./about/about.module').then(m => m.AboutPageModule)
  },
  {
    path: 'licenses',
    loadChildren: () => import('./licenses/licenses.module').then(m => m.LicensesPageModule)
  },
  {
    path: 'profile',
    loadChildren: () => import('./profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: 'manage',
    loadChildren: () => import('./manage.module').then(m => m.ManagePageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
