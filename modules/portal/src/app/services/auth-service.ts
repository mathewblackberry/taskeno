import { Injectable } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import {jwtDecode} from 'jwt-decode';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAdminSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  private userNameSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public userName$: Observable<string> = this.userNameSubject.asObservable();

  constructor() {
    this.checkAdminStatus();
    this.setupAuthListeners();
  }

  private async checkAdminStatus() {
    try {
      const data = await fetchAuthSession();
      const idToken = data.tokens?.idToken;
      const token = idToken!.toString();
      const decoded: any = jwtDecode(token);

      // Extract user's name from the Cognito session
      const userName = decoded['name'] || decoded['preferred_username'];
      this.userNameSubject.next(userName);

      // Check if the user is an admin
      const s = decoded['custom:authorization'];
      if (s) {
        const authArray = JSON.parse(s);
        const isAdmin = authArray.some((auth: any) => auth.role === 'admin');
        this.isAdminSubject.next(isAdmin);
      } else {
        this.isAdminSubject.next(false);
      }
    } catch (error) {
      console.log(`Not logged in`);
      this.isAdminSubject.next(false);
      this.userNameSubject.next('');
    }
  }

  public async refreshAdminStatus() {
    await this.checkAdminStatus();
  }

  private setupAuthListeners() {
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          this.refreshAdminStatus();
          break;
        case 'tokenRefresh':
          console.log('token refresh succeeded');
          break;
        case 'tokenRefresh_failure':
          console.log('token refresh failed');
          break;
        case 'customOAuthState':
          console.log('custom state returned from CognitoHosted UI');
          break;
        case 'signedOut':
          this.refreshAdminStatus();
          break;
        default:
          console.log('unknown event type');
          break;
      }
    });
  }
}
