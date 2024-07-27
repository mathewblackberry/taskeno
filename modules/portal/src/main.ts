import { bootstrapApplication } from '@angular/platform-browser';
import {Amplify} from 'aws-amplify';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { sessionStorage } from 'aws-amplify/utils';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_JKchaTUnw',
      userPoolClientId: '4bhucivp635bg03c2hvs5nfug4',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      }
    }
  }
});
const currentConfig = Amplify.getConfig();
cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage);
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
