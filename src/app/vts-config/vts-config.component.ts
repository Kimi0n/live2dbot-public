import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModelMeshConfig } from '../pojos/model-mesh-config';
import { VtsCommService } from '../vts-comm.service';

@Component({
  selector: 'app-vts-config',
  templateUrl: './vts-config.component.html',
  styleUrls: ['./vts-config.component.scss']
})
export class VtsConfigComponent implements OnInit {

  models: any;
  hotkeys: any;
  connectionStatus: string;

  modelsSub: any;
  hotkeysSub: any;
  connectionStatusSub: Object;

  artmeshGroupName: string = '';
  currentMeshConfig: ModelMeshConfig = new ModelMeshConfig();
  currentMeshConfigSub: Object;

  constructor(private vtsComm: VtsCommService, public router: Router) {
    this.connectionStatus = vtsComm.connectionStatus;
    this.hotkeys = vtsComm.hotkeys;
    this.currentMeshConfig = vtsComm.currentMeshConfig;

    this.connectionStatusSub = vtsComm.connectionStatusChange.subscribe((value) => {
      this.connectionStatus = value;
    });

    this.modelsSub = this.vtsComm.modelListChange.subscribe((value) => {
      this.models = value;
    });

    this.hotkeysSub = this.vtsComm.hotkeysChange.subscribe((value) => {
      this.hotkeys = value;
    });

    this.currentMeshConfigSub = vtsComm.currentMeshConfigChange.subscribe((value) => {
      this.currentMeshConfig = value;
    });
  }

  ngOnInit(): void {
    if(this.connectionStatus != 'Connected') {
      this.router.navigate(['/']);

    } else {
      this.vtsComm.sendRequestNoData('AvailableModelsRequest');
      this.vtsComm.requestHotkeys();
      this.sendDisconnectedToHome();
      this.vtsComm.subscribeToModelLoadedEvent();
      this.vtsComm.subscribeToModelConfigChangedEvent();

    }
  }

  sendLoadModelRequest(value: string) {
    this.vtsComm.loadModelwithAnimation(value);
    this.sendDisconnectedToHome();
  }

  sendHotkeysRequest() {
    this.vtsComm.requestHotkeys();
    this.sendDisconnectedToHome();
  }

  sendHotkeyTriggerRequest(value: string) {
    this.vtsComm.pressHotkeyRequest(value);
    this.sendDisconnectedToHome();
  }

  sendDisconnectedToHome() {
    if(this.connectionStatus != 'Connected') {
      this.router.navigate(['/']);
    }
  }

  sendArtmeshRequest() {
    this.vtsComm.requestArtmeshSelection(this.artmeshGroupName);
  }

  makeGroupRgb(meshGroupName: string) {
    this.vtsComm.requestRgb(meshGroupName);
  }

  editMeshGroup(meshGroupName: string) {
    this.vtsComm.editArtmeshSelection(meshGroupName);
  }

  deleteMeshGroup(meshGroupName: string) {
    this.vtsComm.removeMeshGroup(meshGroupName);
  }

  sendAllTintRequest(clear: boolean) {
    if(clear) {
      this.vtsComm.requestRgb('Clear');
    } else {
      this.vtsComm.requestRgb('All');
    }
  }
}
