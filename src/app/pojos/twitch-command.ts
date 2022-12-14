export class TwitchCommand {

  commandName: string = '';
  fullCommand: string = '';
  commandType: string = '';
  redeemType: string = '';
  cooldown: number = 0;
  globalTimestamp: number = 0;
  isActive: boolean = true;
  commandSpecifics: Object = new Object();

  constructor() {

  }

  addCommandSpecific(o: Object) {
    this.commandSpecifics = o;
  }
}
