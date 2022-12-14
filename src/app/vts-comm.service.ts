import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ModelMesh } from './pojos/model-mesh';
import { ModelMeshConfig } from './pojos/model-mesh-config';
import { VtsAuthService } from './vts-auth.service';

@Injectable({
  providedIn: 'root',
})

//Handles the communication between plugin and VTube Studio
export class VtsCommService {
  vtsConnection: any;
  models: any;
  hotkeys: any;

  currentModelName: string = '';
  currentModelId: string = '';
  currentModelPos: any;

  currentMeshConfig: ModelMeshConfig = new ModelMeshConfig();
  tempArtGroupName: string = '';

  connectionStatus: string = 'Disconnected';
  connectionMessage: string = '';

  connectionStatusChange: Subject<string> = new Subject<string>();
  connectionMessageChange: Subject<string> = new Subject<string>();
  modelListChange: Subject<string> = new Subject<string>();
  hotkeysChange: Subject<string> = new Subject<string>();
  currentMeshConfigChange: Subject<ModelMeshConfig> = new Subject<ModelMeshConfig>();

  constructor(private auth: VtsAuthService) {}

  setConnectionStatus(status: string, message: string) {
    this.connectionStatus = status;
    this.connectionMessage = message;
    this.connectionStatusChange.next(this.connectionStatus);
    this.connectionMessageChange.next(this.connectionMessage);
  }

  //Connects and sets the event listeners
  connect(port: number) {
    if(port == 1337) {
      this.setConnectionStatus(
        'C0NN3CT1NG...',
        'PL34S3 4LL0W TH3 PLU61N 1N VTUB3 STUD10!'
      );
    } else {
      this.setConnectionStatus(
        'Connecting...',
        'Please allow the plugin in VTube Studio!'
      );
    }

    let socket = new WebSocket('ws://localhost:' + port);

    socket.addEventListener('open', () => {
      socket.send(this.auth.checkForCredentials());
      this.vtsConnection = socket;
    });

    socket.addEventListener('error', (event) => {
      this.connectionError(event, port);
    });

    socket.addEventListener('message', (event) => {
      this.parseResponse(JSON.parse(event.data), socket);
    });
  }

  connectionError(error: any, port: number) {
    if(port == 1337) {
      this.setConnectionStatus(
        'C0NN3CT10N F41L3D',
        'PL34S3 M4K3 SUR3 VTUB3 STUD10 1S RUNN1N6 4ND TH3 PLU61N 4PI 1S TURN3D 0N!'
      );
    } else {
      this.setConnectionStatus(
        'Connection failed',
        'Please make sure VTube Studio is running and the plugin API is turned on!'
      );
    }
  }

  //Response handling - MAIN
  parseResponse(response: any, connection: WebSocket) {

    if (response.messageType == 'APIError') {
      this.handleApiError(response.data);
    }

    if (!this.auth.token && response.messageType == 'AuthenticationTokenResponse') {
      this.saveAndReauthToken(response.data, connection);

    } else if (response.messageType == 'AuthenticationResponse') {
      this.checkAndShowAuthStatus(response.data);

    }

    if (response.messageType == 'AvailableModelsResponse') {
      this.models = response.data.availableModels;

      response.data.availableModels.forEach((element: any) => {
        if(element.modelLoaded) {
          this.currentModelName = element.modelName;
          this.currentModelId = element.modelID;
        }
      });

      this.loadMeshConfigFromLocal(this.currentModelName);
      this.modelListChange.next(this.models);
    }

    if (response.messageType == 'CurrentModelResponse') {
      this.currentModelPos = response.data.modelPosition;
    }

    if (response.messageType == 'HotkeysInCurrentModelResponse') {
      this.hotkeys = response.data.availableHotkeys;
      this.hotkeysChange.next(this.hotkeys);
    }

    if (response.messageType == 'ArtMeshSelectionResponse' && response.data.success) {
      let temp: string[] = [];

      response.data.activeArtMeshes.forEach((artmesh: string) => {
        temp.push(artmesh);
      });

      this.currentMeshConfig.modelName = this.currentModelName;
      this.currentMeshConfig.modelId = this.currentModelId;

      this.currentMeshConfig.meshGroups.forEach((meshGroup: ModelMesh) => {
        if(meshGroup.groupName == this.tempArtGroupName) {
          this.removeMeshGroup(this.tempArtGroupName);
        }
      });

      this.currentMeshConfig.addMeshGroup(new ModelMesh(this.tempArtGroupName, temp));
      this.saveMeshConfigToLocal();
      this.currentMeshConfigChange.next(this.currentMeshConfig);
    }

    //Events
    if (response.messageType == 'ModelLoadedEvent' && response.data.modelLoaded) {
      this.sendRequestNoData('AvailableModelsRequest');
      this.requestHotkeys();

      this.sendRequest('MoveModelRequest', {
        timeInSeconds: 0.5,
        valuesAreRelativeToModel: false,
        positionY: this.currentModelPos.positionY,
      });
    }

    if(response.messageType == 'ModelConfigChangedEvent') {
      this.requestHotkeys();
    }
  }

  handleApiError(error: any) {
    //https://github.com/DenchiSoft/VTubeStudio/blob/master/Files/ErrorID.cs
    if (error.errorID == 50) {
      this.setConnectionStatus(
        'Connection failed',
        'Please make sure to allow the plugin in VTube Studio!'
      );
    }
  }

  saveAndReauthToken(data: any, connection: WebSocket) {
    this.auth.token = data.authenticationToken;
    connection.send(this.auth.tokenAuth());
  }

  checkAndShowAuthStatus(data: any) {
    if (data.authenticated == true) {
      this.setConnectionStatus('Connected', '');
      this.sendRequestNoData('AvailableModelsRequest');
      this.requestHotkeys();

    } else {
      this.setConnectionStatus(
        'Connection failed',
        'The token was invalid. Please try to connect again!'
      );

      this.auth.invalidateToken();
    }
  }

  sendRequest(requestType: string, data: any) {
    this.checkAndUpdateWebsocketState();
    this.vtsConnection.send(this.auth.buildRequest(requestType, data));
  }

  sendRequestNoData(requestType: string) {
    this.checkAndUpdateWebsocketState();
    this.vtsConnection.send(this.auth.buildRequestWithoutData(requestType));
  }

  async loadModelwithAnimation(id: string) {
    this.sendRequestNoData('CurrentModelRequest');

    this.sendRequest('MoveModelRequest', {
      timeInSeconds: 0.7,
      valuesAreRelativeToModel: false,
      positionY: -10.0,
    });

    await new Promise((resolve) => setTimeout(resolve, 700));

    this.sendRequest('ModelLoadRequest', {
      modelID: id,
    });
  }

  subscribeToModelLoadedEvent() {
    this.sendRequest('EventSubscriptionRequest', {
      eventName: 'ModelLoadedEvent',
      subscribe: true
    });
  }

  subscribeToModelConfigChangedEvent() {
    this.sendRequest('EventSubscriptionRequest', {
      eventName: 'ModelConfigChangedEvent',
      subscribe: true
    });
  }

  checkAndUpdateWebsocketState() {
    if (
      !this.vtsConnection ||
      this.vtsConnection.readyState == WebSocket.CLOSING ||
      this.vtsConnection.readyState == WebSocket.CLOSED
    ) {
      this.setConnectionStatus(
        'Disconnected',
        'Connection to VTube Studio lost!'
      );

    } else if (this.vtsConnection.readyState == WebSocket.OPEN) {
      this.setConnectionStatus('Connected', '');

    }
  }

  requestHotkeys() {
    this.sendRequestNoData('HotkeysInCurrentModelRequest');
  }

  pressHotkeyRequest(id: string) {
    this.sendRequest('HotkeyTriggerRequest', {
      hotkeyID: id,
    });
  }

  pressHotkeyRequestByName(name: string) {
    this.hotkeys.forEach((hotkey: any) => {
      if(hotkey.name == name) {
        this.sendRequest('HotkeyTriggerRequest', {
          hotkeyID: hotkey.hotkeyID,
        });
      }
    });
  }

  requestArtmeshSelection(groupName: string) {
    this.tempArtGroupName = groupName;
    this.sendRequestNoData('ArtMeshSelectionRequest');
  }

  editArtmeshSelection(groupName: string) {
    let artMeshes: Array<string> = Array();

    this.currentMeshConfig.meshGroups.forEach((meshGroup: ModelMesh) => {
      if(meshGroup.groupName == groupName) {
        artMeshes = meshGroup.artMeshes;
      }
    });

    this.tempArtGroupName = groupName;

    this.sendRequest('ArtMeshSelectionRequest', {
      "activeArtMeshes": artMeshes
    });
  }

  requestRgb(meshGroupName: string) {
    if(meshGroupName == 'All') {
      this.sendAllTintRequest(false);

    } else if(meshGroupName == 'Clear') {
      this.sendAllTintRequest(true);

    } else {
      this.currentMeshConfig.meshGroups.forEach((group: ModelMesh) => {
        if(group.groupName == meshGroupName) {
          this.sendRequest('ColorTintRequest', {
            "colorTint": {
              "colorR": 255,
              "colorG": 255,
              "colorB": 255,
              "colorA": 255,
              "mixWithSceneLightingColor": 1,
              "jeb_": true
            },
            "artMeshMatcher": {
              "tintAll": false,
              "nameExact": group.artMeshes
            }
          });

        }
      });

    }
  }

  sendAllTintRequest(clear: boolean) {
    if(clear) {
      this.sendRequest('ColorTintRequest', {
        "colorTint": {
          "colorR": 255,
          "colorG": 255,
          "colorB": 255,
          "colorA": 255,
          "mixWithSceneLightingColor": 1
        },
        "artMeshMatcher": {
          "tintAll": true
        }
      });

    } else {
      this.sendRequest('ColorTintRequest', {
        "colorTint": {
          "colorR": 255,
          "colorG": 255,
          "colorB": 255,
          "colorA": 255,
          "mixWithSceneLightingColor": 1,
          "jeb_": true
        },
        "artMeshMatcher": {
          "tintAll": true
        }
      });

    }
  }

  removeMeshGroup(name: string) {
    this.currentMeshConfig.removeMeshGroup(name);
    this.saveMeshConfigToLocal();
  }

  saveMeshConfigToLocal() {
    if(localStorage.getItem('meshConfigs')) {
      let configs: Array<ModelMeshConfig> = JSON.parse(localStorage.getItem('meshConfigs')!);

      configs.forEach((config: ModelMeshConfig, index: number) => {
        if(config.modelName == this.currentMeshConfig.modelName) {
          configs.splice(index, 1);
        }
      });

      configs.push(this.currentMeshConfig);

      localStorage.setItem('meshConfigs', JSON.stringify(configs));

    } else {
      localStorage.setItem('meshConfigs', JSON.stringify([this.currentMeshConfig]));
    }
  }

  loadMeshConfigFromLocal(name: string) {
    if(localStorage.getItem('meshConfigs')) {
      let configs: Array<ModelMeshConfig> = JSON.parse(localStorage.getItem('meshConfigs')!);

      let configFound: boolean = false;

      configs.forEach((config: ModelMeshConfig) => {
        if(name == config.modelName) {
          this.currentMeshConfig = new ModelMeshConfig(config.modelName, config.modelId, config.meshGroups);
          configFound = true;
        }
      });

      if(!configFound) {
          this.currentMeshConfig = new ModelMeshConfig();
      }

      this.currentMeshConfigChange.next(this.currentMeshConfig);
    }
  }
}
