import { Component } from '@angular/core';
import { VtsCommService } from './vts-comm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'live2dbot';
  connectionStatus: string;
  connectionStatusSub: Object;

  constructor(private vtsComm: VtsCommService) {
    this.connectionStatus = this.vtsComm.connectionStatus;

    this.connectionStatusSub = this.vtsComm.connectionStatusChange.subscribe((value) => {
      this.connectionStatus = value;
    });
  }
}
