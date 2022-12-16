import { Component, OnInit } from '@angular/core';
import { ModelMeshConfig } from '../pojos/model-mesh-config';
import { TwitchCommand } from '../pojos/twitch-command';
import { TwitchCommService } from '../twitch-comm.service';
import { VtsCommService } from '../vts-comm.service';

@Component({
  selector: 'app-twitch-config',
  templateUrl: './twitch-config.component.html',
  styleUrls: ['./twitch-config.component.scss']
})

export class TwitchConfigComponent implements OnInit {

  commandName: string = '';
  commandTypes: Array<string>;
  selectedType: string = 'TextOutput';

  commands: Array<any> = [];
  commandsSub: Object;

  connectionStatus: string = 'Disconnected';
  connectionStatusSub: Object;

  tconnectionStatus: string = 'Disconnected';
  tconnectionStatusSub: Object;

  models: any;
  modelsSub: Object;

  hotkeys: any;
  hotkeysSub: Object;

  redeemScanMode: boolean = false;
  redeemScanModeSub: Object;

  currentMeshConfig: ModelMeshConfig = new ModelMeshConfig();
  currentMeshConfigSub: Object;

  savedRedeemId: string = '';
  savedRedeemIdSub: Object;

  selectedModelId: string = '';
  selectedModelName: string = '';
  selectedMeshConfig: string = '';
  selectedHotkeyName: string = '';

  selectedRedeemType: boolean = false;
  selectedWithHotkeyDuration: boolean = false;
  selectedWithMeshDuration: boolean = false;
  selectedWithCooldownDuration: boolean = false;

  textOutputText: string = '';
  vtsModelChangeWasAdded: boolean = false;

  apiLink: string = '';
  audioApiLink: string = '';
  apiField: string = '';
  audioApiToken: string = '';

  currentAddMode: string = '';
  setHotkeyDuration: string = '0';
  setMeshDuration: string = '0';
  setCooldownDuration: string = '0';

  constructor(private twitchComm: TwitchCommService, private vtsComm: VtsCommService) {
    this.commands = twitchComm.commands;
    this.connectionStatus = vtsComm.connectionStatus;
    this.models = vtsComm.models;
    this.hotkeys = vtsComm.hotkeys;
    this.redeemScanMode = twitchComm.redeemScanMode;
    this.tconnectionStatus = twitchComm.tconnectionStatus;

    this.commandTypes = [
       'TextOutput',
       'ApiCallGetJson',
       'ApiCallGetAudio',
       'AllCommands'
    ];

    this.commandsSub = twitchComm.commandsChange.subscribe((value) => {
      this.commands = value;
    });

    this.redeemScanModeSub = twitchComm.redeemScanModeChange.subscribe((value) => {
      this.redeemScanMode = value;
    });

    this.connectionStatusSub = vtsComm.connectionStatusChange.subscribe((value) => {
      this.connectionStatus = value;
    });

    this.tconnectionStatusSub = twitchComm.tconnectionStatusChange.subscribe((value) => {
      this.tconnectionStatus = value;
    });

    this.modelsSub = vtsComm.modelListChange.subscribe((value) => {
      this.models = value;
      this.selectedModelName = (this.models.length > 0) ? this.models[0].name : '';
      this.selectedModelId = (this.models.length > 0) ? this.models[0].modelID : '';
    });

    this.hotkeysSub = this.vtsComm.hotkeysChange.subscribe((value) => {
      this.hotkeys = value;
      this.selectedHotkeyName = (this.hotkeys.length > 0) ? this.hotkeys[0].name : '';
    });

    this.currentMeshConfigSub = vtsComm.currentMeshConfigChange.subscribe((value) => {
      this.currentMeshConfig = value;
      this.selectedMeshConfig = 'All';
    });

    this.savedRedeemIdSub = this.twitchComm.savedRedeemIdChange.subscribe((value) => {
      this.savedRedeemId = value;
    });
  }

  ngOnInit(): void {
    this.updateVtsCommandAvailability();
  }

  saveRedeem() {
    this.commandName = `${this.savedRedeemId} ((args))`;
    this.saveCommand(true);
    this.twitchComm.toggleScanMode(false);
  }

  saveCommand(isRedeem: boolean) {
    const splitMessage: Array<string> = this.commandName.toLowerCase().split(" ");
    let tempCommand = new TwitchCommand();

    if(isRedeem) {
      tempCommand.commandName = splitMessage[0];
      tempCommand.fullCommand = this.commandName.toLowerCase();
    } else {
      tempCommand.commandName = "!" + splitMessage[0];
      tempCommand.fullCommand = "!" + this.commandName.toLowerCase();
    }

    tempCommand.commandType = this.selectedType;
    tempCommand.redeemType = (isRedeem) ? "redeem" : "command";

    tempCommand.cooldown = (this.selectedWithCooldownDuration && !isRedeem) ? parseInt(this.setCooldownDuration) : 0;
    tempCommand.globalTimestamp = 0;

    if(this.selectedType == 'TextOutput') {
      tempCommand.commandSpecifics = {
        "outputText": this.textOutputText
      };
    }

    if(this.selectedType == 'VTSModelChange') {
      tempCommand.commandSpecifics = {
        "modelName": this.selectedModelName,
        "modelId": this.selectedModelId
      };
    }

    if(this.selectedType == 'ApiCallGetJson') {
      tempCommand.commandSpecifics = {
        "link": this.apiLink,
        "field": this.apiField
      };
    }

    if(this.selectedType == 'ApiCallGetAudio') {
      tempCommand.commandSpecifics = {
        "audioLink": this.audioApiLink,
        "audioToken": this.audioApiToken
      };
    }

    if(this.selectedType == 'VTSGamingMode') {
      tempCommand.commandSpecifics = {
        "configName": this.selectedMeshConfig,
        "meshDuration": (this.selectedWithMeshDuration) ? parseInt(this.setMeshDuration) : 0
      };
    }

    if(this.selectedType == 'VTSHotkeyTrigger') {
      if(Number.isNaN(parseInt(this.setHotkeyDuration))) {
        this.setHotkeyDuration = "0";
      }

      tempCommand.commandSpecifics = {
        "hotkeyName": this.selectedHotkeyName,
        "hotkeyDuration": (this.selectedWithHotkeyDuration) ? parseInt(this.setHotkeyDuration) : 0
      };
    }

    if(this.selectedType == 'AllCommands') {
      tempCommand.commandSpecifics = {
        "isAllCommands": "true"
      };
    }

    this.twitchComm.addCommand(JSON.stringify(tempCommand));
    this.updateVtsCommandAvailability();
    this.switchAddMode("");
    this.savedRedeemId = '';
    this.clearInputs();
  }

  deleteCommand(sCommand: string) {
    this.twitchComm.removeCommand(sCommand);
  }

  //Puts the appropriate information of the selected command/redeem in the config box
  editCommand(command: any) {

    if(command.redeemType == 'command') {
      this.switchAddMode('command');
      this.commandName = command.fullCommand.slice(1);
    }

    if(command.redeemType == 'redeem' && this.tconnectionStatus == 'Connected') {
      this.switchAddMode('redeem');
      this.savedRedeemId = command.commandName;
    }
    
    this.updateSelection(command.commandType);
    this.textOutputText = (command.commandSpecifics.outputText) ? command.commandSpecifics.outputText : '';  
    this.apiLink = (command.commandSpecifics.link) ? command.commandSpecifics.link : '';  
    this.apiField = (command.commandSpecifics.field) ? command.commandSpecifics.field : '';  
    this.audioApiLink = (command.commandSpecifics.audioLink) ? command.commandSpecifics.audioLink : ''; 
    this.audioApiToken =  (command.commandSpecifics.audioToken) ? command.commandSpecifics.audioToken : ''; 

    if(command.commandSpecifics.modelName && command.commandSpecifics.modelId) {
      this.updateModelSelectionInternal(command.commandSpecifics.modelId, command.commandSpecifics.modelName);
    }

    if(command.commandSpecifics.hotkeyName) {
      this.updateHotkeySelection(command.commandSpecifics.hotkeyName);
    }
    
    if(command.commandSpecifics.hotkeyDuration) {
      this.setHotkeyDuration = command.commandSpecifics.hotkeyDuration;
      this.selectedWithHotkeyDuration = false;

      if(parseInt(command.commandSpecifics.hotkeyDuration) > 0) {
        this.selectedWithHotkeyDuration = true;
      }
    } else {
      this.setHotkeyDuration = "0";
      this.selectedWithHotkeyDuration = false;
      
    }

    if(command.commandSpecifics.meshDuration) {
      this.setMeshDuration = command.commandSpecifics.meshDuration;
      this.selectedWithMeshDuration = false;

      if(parseInt(command.commandSpecifics.meshDuration) > 0) {
        this.selectedWithMeshDuration = true;
      }
    } else {
      this.setMeshDuration = "0";
      this.selectedWithMeshDuration = false;
    }

    if(command.cooldown) {
      this.setCooldownDuration = command.cooldown;
      this.selectedWithCooldownDuration = false;

      if(parseInt(command.cooldown) > 0) {
        this.selectedWithCooldownDuration = true;
      }
    } else {
      this.setCooldownDuration = "0";
      this.selectedWithCooldownDuration = false;
    }

    if(command.commandSpecifics.configName) {
      this.updateMeshGroupSelectionInternal(command.commandSpecifics.configName);
    }
  }

  updateSelection(value: string) {
    this.selectedType = value;
  }

  updateModelSelection(event: any, modelName: string) {
    this.selectedModelName = modelName;
    this.selectedModelId = event.target.value;
  }

  updateModelSelectionInternal(id: string, modelName: string) {
    this.selectedModelName = modelName;
    this.selectedModelId = id;
  }

  updateHotkeySelection(hotkeyName: string) {
    this.selectedHotkeyName = hotkeyName;
  }

  updateMeshGroupSelection(event: any) {
    this.selectedMeshConfig = event.target.value;
  }

  updateMeshGroupSelectionInternal(meshGroupName: string) {
    this.selectedMeshConfig = meshGroupName;
  }

  updateVtsCommandAvailability() {
    if(this.connectionStatus == 'Connected' && !this.vtsModelChangeWasAdded) {
      this.vtsModelChangeWasAdded = true;
      this.commandTypes.push('VTSModelChange', 'VTSHotkeyTrigger', 'VTSGamingMode');
      this.vtsComm.sendRequestNoData('AvailableModelsRequest');
      this.vtsComm.requestHotkeys();
    }

  }

  exportCommands() {
    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(JSON.stringify(this.commands));
    hiddenElement.target = '_blank';
    hiddenElement.download = 'commands.json';
    hiddenElement.click();
  }

  importCommands(evt: any) {
    try {
      let files = evt.target.files;

      if (!files.length) {
          alert('No file selected!');
          return;
      }

      let file = files[0];
      let reader = new FileReader();
      const self = this;

      reader.onload = (event) => {
        if(event.target != null) {
          this.twitchComm.importCommands(event.target.result);
        }
      };

      reader.readAsText(file);

    } catch (err) {
        console.error(err);

    }
  }

  updateRedeemType() {
    this.selectedRedeemType = !this.selectedRedeemType;
  }

  updateWithDuration() {
    this.selectedWithHotkeyDuration = !this.selectedWithHotkeyDuration;
  }

  updateWithMeshDuration() {
    this.selectedWithMeshDuration = !this.selectedWithMeshDuration;
  }

  updateWithCooldownDuration() {
    this.selectedWithCooldownDuration = !this.selectedWithCooldownDuration;
  }

  switchAddMode(mode: string) {
    this.currentAddMode = mode;

    if(mode == 'redeem') {
      this.twitchComm.toggleScanMode(true);
    }

    if(mode == '') {
      this.twitchComm.toggleScanMode(false);
      this.clearInputs();
    }
  }

  toggleCommand(commandName: string) {
    this.twitchComm.toggleCommand(commandName);
  }

  clearInputs() {
    this.commandName = '';
    this.textOutputText = '';
    this.apiLink = '';
    this.apiField = '';
    this.audioApiLink = '';
    this.audioApiToken = '';
    this.selectedWithHotkeyDuration = false;
    this.selectedWithCooldownDuration = false;
    this.selectedWithMeshDuration = false;
  }
}