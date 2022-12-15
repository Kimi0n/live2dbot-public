import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as tmi from 'tmi.js';
import { VtsCommService } from './vts-comm.service';
import { HttpClient } from '@angular/common/http';
import { TwitchCommand } from './pojos/twitch-command';

@Injectable({
  providedIn: 'root'
})
export class TwitchCommService {
  clientYoink: any;
  channel: string = '';
  storageName: string = 'twitchCommands';

  redeemScanMode: boolean = false;
  redeemScanModeChange: Subject<boolean> = new Subject<boolean>();

  tconnectionStatus: string = 'Disconnected';
  tconnectionStatusChange: Subject<string> = new Subject<string>();

  commands: Array<any> = [];
  commandsChange: Subject<Array<any>> = new Subject<Array<any>>();

  savedRedeemId: string = '';
  savedRedeemIdChange: Subject<string> = new Subject<string>();

  constructor(private vtsComm: VtsCommService, private http: HttpClient) {
    this.readCommandsFromLocal();
  }

  connect(username: string, targetChannel: string, token: string) {
    const client = tmi.Client({
      "identity": {
        "username": username,
        "password": "oauth:" + token
      },
      "channels": [ targetChannel ]
    });

    this.clientYoink = client;
    client.connect();
    this.channel = targetChannel;

    //I have to do it this way because tmijs doesn't allow you to set the auth data after creating the object
    client.on('message', (target: string, context: Object, message: string, self: boolean) => {
      this.onMessageHandler(client, target, context, message, self);
    });

    client.on('connected', () => {
      this.setConnectionStatus('Connected');
    });

    client.on('disconnected', () => {
      this.setConnectionStatus('Disconnected');
    });
  }

  disconnect() {
    this.clientYoink.disconnect();
  }

  onMessageHandler(client: tmi.Client, target: string, context: any, message: string, self: boolean) {
    if(self) { return };
    if(this.redeemScanMode) {
      if(this.isRedeem(context)) {
        //client.say(target, message + " | " + context["custom-reward-id"]);
        this.savedRedeemId = context["custom-reward-id"];
        this.savedRedeemIdChange.next(this.savedRedeemId);
        return;
      }
    }

    const splitMessage: Array<string> = message.toLowerCase().split(" ");

    if((splitMessage.length > 0 && message.startsWith('!')) || this.isRedeem(context)) {
      this.commands.forEach((command) => {
        if(splitMessage[0] == (command.commandName) || context["custom-reward-id"] == command.commandName) {
          if(command.isActive && (context["custom-reward-id"] || this.isNotOnCooldown(command.cooldown, command.globalTimestamp))) {
            command.globalTimestamp = Date.now();
            this.redeemHandler(client, target, context, message, self, command)
          }
        }
      });
    }
  }

  redeemHandler(client: tmi.Client, target: string, context: any, message: string, self: boolean, command: any) {
    if(command.commandType == 'TextOutput') {
      client.say(target, this.parseMessage(message, command.fullCommand, command.commandSpecifics.outputText, context["display-name"], this.isRedeem(context)));

    } else if(command.commandType == 'VTSModelChange') {
      this.vtsComm.subscribeToModelLoadedEvent();
      this.vtsComm.loadModelwithAnimation(command.commandSpecifics.modelId);

    } else if(command.commandType == 'ApiCallGetJson') {
      this.makeApiCall(client, message, command, context["display-name"], target, this.isRedeem(context));

    } else if(command.commandType == 'ApiCallGetAudio') {
      this.makeAudioApiCall(client, target, message, command, this.isRedeem(context));

    } else if(command.commandType == 'VTSGamingMode') {
      this.vtsComm.requestRgb(command.commandSpecifics.configName);

      if(command.commandSpecifics.meshDuration > 0) {
        const temp = parseInt(command.commandSpecifics.meshDuration) * 1000;

        setTimeout(() => {
          this.vtsComm.sendAllTintRequest(true);
        }, temp);
      }

    } else if(command.commandType == 'VTSHotkeyTrigger') {
      this.vtsComm.subscribeToModelConfigChangedEvent();
      this.vtsComm.pressHotkeyRequestByName(command.commandSpecifics.hotkeyName);

      if(command.commandSpecifics.hotkeyDuration > 0) {
        const temp = parseInt(command.commandSpecifics.hotkeyDuration) * 1000;

        setTimeout(() => {
          this.vtsComm.pressHotkeyRequestByName(command.commandSpecifics.hotkeyName);
        }, temp);
      }
    } else if(command.commandType == 'AllCommands') {
      client.say(target, this.generateCommandList(this.commands));

    }
  }

  isNotOnCooldown(cooldownInSecs: number, lastTimeUsed: number): boolean {
    return Date.now() >= ((cooldownInSecs * 1000) + lastTimeUsed);
  }

  generateCommandList(commands: Array<any>): string {
      let returnString: string = '';

      if(commands) {
        commands.forEach((command: any) => {
          if(command.redeemType == 'command' && !command.commandSpecifics.isAllCommands && command.isActive) {
            returnString += command.commandName;

            if(command.fullCommand.includes("((args))")) {
              returnString += ' [INPUT]';
            }

            returnString += ', ';
          }
        });
      }

      if(returnString == '') {
        returnString = 'No commands have been set up yet';
      }

      return returnString.replace(/,\s*$/, "");
  }

  isRedeem(context: any): boolean {
    if(context["custom-reward-id"]) {
      return true;
    } else {
      return false;
    }
  }

  setConnectionStatus(status: string) {
    this.tconnectionStatus = status;
    this.tconnectionStatusChange.next(this.tconnectionStatus);
  }

  addCommand(o: string) {
    const newCommand = JSON.parse(o);

    this.commands.forEach((command, index) => { //TODO: Optimize each instance of this block
      if(command.fullCommand == newCommand.fullCommand) {
        this.commands.splice(index, 1);
      }
    });

    this.commands.push(newCommand);
    this.commandsChange.next(this.commands);
    this.writeCommandsToLocal();
  }

  removeCommand(sCommand: string) {
    this.commands.forEach((command, index) => {
      if(command.fullCommand == sCommand) {
        this.commands.splice(index, 1);
      }
    });

    this.commandsChange.next(this.commands);
    this.writeCommandsToLocal();
  }

  parseMessage(userMsg: string, fullCommand: string, msg: string, caller: string, isRedeem: boolean) {
    let parsedMessage: string = msg;

    parsedMessage = this.parseMessageArgs(userMsg, fullCommand, parsedMessage, isRedeem);
    parsedMessage = this.parseRng(parsedMessage);
    parsedMessage = parsedMessage.replace(/\(\(self\)\)/g, caller);
    return this.parseRngWords(parsedMessage);
  }

  parseMessageArgs(userMsg: string, fullCommand: string, parsedMessage: string, isRedeem: boolean) {
    const splitMessage: Array<string> = userMsg.toLowerCase().split(" ");

    if(fullCommand.includes("((args))") && parsedMessage.includes("((args))")) {
      if(splitMessage.length > 1 || isRedeem) {
        if(isRedeem) {
          return parsedMessage.replace(/\(\(args\)\)/g, userMsg);
        } else {
          return parsedMessage.replace(/\(\(args\)\)/g, this.removeFirstWord(userMsg));
        }
      } else {
        return '';
      }

    } else if((fullCommand.includes("((args))") && splitMessage[1] && !parsedMessage.includes("((args))")) || isRedeem) {
      return parsedMessage;

    } else if((!fullCommand.includes("((args))") && !splitMessage[1]) || isRedeem) {
      return parsedMessage;

    } else {
      return '';
    }
  }

  parseRng(msg: string) {
    let hasChanged = true;
    let parsingMessage = msg;

      do{
          let parsed;
          const regexNum = /\(\([0-9]+\/[0-9]+\)\)/;

          try{
              parsed = parsingMessage.match(regexNum)!.toString();
              const cleaned = parsed.replace("((", "").replace("))", "");
              const array = cleaned.split("/");
              const min = parseInt(array[0]);
              const number = Math.floor(Math.random() * (parseInt(array[1]) - min + 1)) + min;
              const newMessage = parsingMessage.replace(regexNum, number.toString());

              if(newMessage == parsingMessage) {
                  hasChanged = false;
              } else {
                  parsingMessage = newMessage;
              }
          } catch(error) {
              return parsingMessage;
          }

      } while(hasChanged);
      return parsingMessage;
  }

  parseRngWords(msg: string) {
    let hasChanged = true;
    let parsingMessage = msg;

      do{
          let parsed;
          const regexNum = /\(\(([^)]+)\)\)/;

          try{
              parsed = parsingMessage.match(regexNum)!.toString();
              const isolated = parsed.split(",");
              const cleaned = isolated[1];
              const array = cleaned.split("/");
              const number = Math.floor(Math.random() * (array.length));
              const newMessage = parsingMessage.replace(regexNum, array[number]);

              if(newMessage == parsingMessage) {
                  hasChanged = false;
              } else {
                  parsingMessage = newMessage;
              }
          } catch(error) {
              return parsingMessage;
          }

      } while(hasChanged);
      return parsingMessage;
  }

  async makeAudioApiCall(client: tmi.Client, target: string, userMsg: string, savedCommand: any, isRedeem: boolean) {
    const link: string = this.parseMessageArgs(userMsg, savedCommand.fullCommand, savedCommand.commandSpecifics.audioLink, isRedeem);
    let speak;

    if(savedCommand.commandSpecifics.audioToken != '') {
      speak = await fetch(link, {
        headers: { 'Authorization': 'Bearer ' + savedCommand.commandSpecifics.audioToken }
      }).catch((error) => {
        console.error(error)
        client.say(target, this.httpErrorHandler(error.status, error.statusText));
      });
    } else {
      speak = await fetch(link).catch((error) => {
        console.error(error)
        client.say(target, this.httpErrorHandler(error.status, error.statusText));
      });
    }

    if(speak) {
      let mp3 = await speak.blob();
      let blobUrl = URL.createObjectURL(mp3);
      new Audio(blobUrl).play();
    }
  }

  async makeApiCall(client: tmi.Client, userMsg: string, savedCommand: any, caller: string, target: string, isRedeem: boolean) {
    const link: string = this.parseMessageArgs(userMsg, savedCommand.fullCommand, savedCommand.commandSpecifics.link, isRedeem);
    let responseField: string;

    if(savedCommand.commandSpecifics.field != '') {
      responseField = savedCommand.commandSpecifics.field;
    } else {
      responseField = '';
    }


    await this.http.get(link, {responseType: 'json'}).subscribe((data: any) => {
      if(responseField == '') {
        console.log(data);
        client.say(target, data);

      } else {
        client.say(target, this.parseResponseField(responseField, data).toString());
      }
    }, (error: any) => {
      console.error(error)
      client.say(target, this.httpErrorHandler(error.status, error.statusText));
    });

  }

  httpErrorHandler(statusNum: number, statusMsg: string): string {
    if(statusNum == 0) {
      return `[Error] Looks like that command isn't working (check the command configuration)`;
    }

    if(statusNum == 200) {
      return `[Error] That API isn't giving me what i need... (check the API Link of this command)`;
    }

    return ``;
  }

  truncate( str: any, n:any, useWordBoundary: any){
    if (str.length <= n) { return str; }
    const subString = str.substr(0, n-1);
    return (useWordBoundary 
        ? subString.substr(0, subString.lastIndexOf(" ")) 
        : subString) + "&hellip;";
};

  traverseObjectByString(o: any, s: string) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');

    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }

    return o;
  }

  parseResponseField(responseField: string, data: any) {
    let str = responseField;
    let hasChanged = true;
    const pattern = /(\(\()([^\(\)]*)(\)\))/;

    do {
      let extractedField = pattern.exec(str);
      let fieldValue = '';

      if(extractedField != null) {
        const firstMatch = extractedField[0].replace("((", "").replace("))", "");
        fieldValue = this.traverseObjectByString(data, firstMatch);
      }

      let newString;

      if(fieldValue != null) {
        newString = str.replace(pattern, fieldValue);
      } else {
        newString = str.replace(pattern, '');
      }

      if(str == newString) {
        hasChanged = false;
      } else {
        str = newString;
      }

    }while(hasChanged);

    if(!str) {
      return `[Error] I couldn't find what you need (check the return field of the command)`;
    }

    return str;
  }

  writeCommandsToLocal() {
    localStorage.setItem(this.storageName, JSON.stringify(this.commands));
  }

  readCommandsFromLocal() {
    const temp = localStorage.getItem(this.storageName);

    if(temp != null) {
      this.commands = JSON.parse(temp);
    }

    this.commandsChange.next(this.commands);
  }

  sendToChat(msg: string) {
    this.clientYoink.say(this.channel, msg);
  }

  removeFirstWord(str: string) {
    const indexOfSpace = str.indexOf(' ');

    if (indexOfSpace === -1) {
      return '';
    }

    return str.substring(indexOfSpace + 1);
  }

  importCommands(jsonStr: any) {
    let exists = false;

    JSON.parse(jsonStr).forEach((command: any) => {
      exists = false;
      this.commands.forEach((savedCommand: any) => {
        if(command.fullCommand == savedCommand.fullCommand) {
          exists = true;
        }
      });

      if(!exists) {
        this.commands.push(command);
      }
    });

    this.writeCommandsToLocal();
  }

  toggleScanMode(status: boolean) {
    this.redeemScanMode = status;
    this.redeemScanModeChange.next(this.redeemScanMode);
  }

  toggleCommand(commandName: string) {
    this.commands.forEach((savedCommand: any) => {
      if(commandName == savedCommand.fullCommand) {
        savedCommand.isActive = !savedCommand.isActive;
      }
    });

    this.writeCommandsToLocal();
  }
}
