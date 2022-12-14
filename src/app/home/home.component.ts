import { Component, OnInit } from '@angular/core';
import { TwitchCommService } from '../twitch-comm.service';
import { VtsCommService } from '../vts-comm.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  vtsPort: number = 8001;

  username: string = '';
  targetChannel: string  = '';
  token: string = '';

  lsName: string = 'TwitchName';
  lsChannel: string = 'TwitchChannel';
  lsToken: string = 'TwitchToken';

  sendText: string = '';

  connectionStatus: string;
  connectionMessage: string;
  tconnectionStatus: string;

  connectionStatusSub: Object;
  connectionMessageSub: Object;
  tconnectionStatusSub: Object;

  constructor(private vtsComm: VtsCommService, private twitchComm: TwitchCommService) {
    this.connectionStatus = vtsComm.connectionStatus;
    this.connectionMessage = vtsComm.connectionMessage;
    this.tconnectionStatus = twitchComm.tconnectionStatus;

    this.connectionStatusSub = vtsComm.connectionStatusChange.subscribe((value) => {
      this.connectionStatus = value;
    });

    this.connectionMessageSub = vtsComm.connectionMessageChange.subscribe((value) => {
      this.connectionMessage = value;
    });

    this.tconnectionStatusSub = twitchComm.tconnectionStatusChange.subscribe((value) => {
      this.tconnectionStatus = value;
    });

    this.loadDataFromLocal();
  }

  ngOnInit(): void { }

  connectToVts() {
    this.vtsComm.connect(this.vtsPort);
  }

  connectToTwitch() {
    this.saveDataToLocal();
    const temp = this.targetChannel.split(" ");

    if(this.token.includes("oauth:")) {
      this.token = this.token.replace("oauth:", "");
    }

    if(temp.length > 0) {
      this.twitchComm.connect(
        this.username,
        temp[0],
        this.token
      );
    }
  }

  disconnectFromTwitch() {
    this.twitchComm.disconnect();
  }

  saveDataToLocal() {
    localStorage.setItem(this.lsName, this.username);
    localStorage.setItem(this.lsChannel, this.targetChannel);
    localStorage.setItem(this.lsToken, this.token);
  }

  loadDataFromLocal() {
    if(localStorage.getItem(this.lsName)) {
      this.username = localStorage.getItem(this.lsName) ?? '';
      this.targetChannel = localStorage.getItem(this.lsChannel) ?? '';
      this.token = localStorage.getItem(this.lsToken) ?? '';
    }

  }

  sendToChat(msg: string) {
    this.twitchComm.sendToChat(msg);
    this.sendText = '';
  }
}
