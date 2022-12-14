import { Injectable } from '@angular/core';
import { Base64Icon } from './pojos/base64-icon';

@Injectable({
  providedIn: 'root',
})

// Authentification class that holds the token.
export class VtsAuthService {
  token: any;
  appName: string = 'Live2DBot v.0.4.1sleepypurin';
  devName: string = 'Kimion (Kimi0n)';
  tokenSaved: boolean = false;
  storageName: string = 'VTS ' + this.appName;

  constructor() {}

  // Checks if a token is saved in local storage
  checkForCredentials() {
    if (localStorage.getItem(this.storageName)) {
      this.tokenSaved = true;
      this.token = localStorage.getItem(this.storageName);
      return this.tokenAuth();
    } else {
      return this.requestToken();
    }
  }

  // Builds the session authentication request
  tokenAuth() {
    let data = {
      pluginName: this.appName,
      pluginDeveloper: this.devName,
      authenticationToken: this.token,
    };

    let request = this.buildRequest('AuthenticationRequest', data);

    if (!this.tokenSaved) {
      localStorage.setItem(this.storageName, this.token);
    }

    return request;
  }

  // Builds the one time authentication token request (the one you'll have to allow in VTS once)
  requestToken() {
    const iconB = new Base64Icon();

    let data = {
      pluginName: this.appName,
      pluginDeveloper: this.devName,
      pluginIcon: iconB.icon
    };

    let request = this.buildRequest('AuthenticationTokenRequest', data);

    return request;
  }

  // Removes token
  invalidateToken() {
    localStorage.removeItem(this.storageName);
    this.tokenSaved = false;
  }

  // Creates a valid request to the VTube Studio API
  buildRequestWithoutData(requestType: string) {
    const request = {
      apiName: 'VTubeStudioPublicAPI',
      apiVersion: '1.0',
      messageType: requestType,
    };

    return JSON.stringify(request);
  }

  // Creates a valid request to the VTube Studio API
  buildRequest(requestType: string, data: any) {
    const request = {
      apiName: 'VTubeStudioPublicAPI',
      apiVersion: '1.0',
      messageType: requestType,
      data: data,
    };

    return JSON.stringify(request);
  }
}
