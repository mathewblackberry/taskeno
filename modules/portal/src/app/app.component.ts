import {AsyncPipe, CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {AmplifyAuthenticatorModule} from '@aws-amplify/ui-angular';
import {Observable} from 'rxjs';
import {SpinnerService} from './services/spinner-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, CommonModule, AmplifyAuthenticatorModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
  title = 'portal';
  spinnerVisible$: Observable<boolean>;

  public formFields = {
    signIn: {
      username: {
        label: 'Email',
        placeholder: 'Enter your Email',
        order: 1
      },
      password: {
        order: 2
      }
    },
    signUp: {
      name: {
        label: 'Full Name',
        order: 1
      },
      username: {
        label: 'Email',
        placeholder: 'Enter your Email',
        order: 2
      },
      password: {
        order: 3
      },
      confirm_password: {
        order: 4
      }
    },
    resetPassword: {
      username: {
        label: 'Email',
        placeholder: 'Enter your Email'
      }
    },
    setupTotp: {
      QR: {
        totpIssuer: 'Black Salt IT',
      },
    },
  };

  constructor(private spinnerService: SpinnerService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {
    this.spinnerVisible$ = this.spinnerService.spinner$;
  }

  ngOnInit() {
    this.spinnerVisible$.subscribe(() => {
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    });
  }
}
