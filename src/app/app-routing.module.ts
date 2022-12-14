import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { TwitchConfigComponent } from './twitch-config/twitch-config.component';
import { VtsConfigComponent } from './vts-config/vts-config.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'vts', component: VtsConfigComponent },
  { path: 'twitch', component: TwitchConfigComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
