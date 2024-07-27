import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [
    FormsModule, MatIcon, MatInputModule, MatButtonModule
  ],
  template: `
    <div class="password-box">
      <span class="password">{{ hidePassword && password ? hiddenPassword : password }}</span>
      <span class="spacer"></span>
      @if (password) {
        <button mat-icon-button (click)="toggleHidePassword1()">
          <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        <button mat-icon-button (click)="copyPassword(password)">
          <mat-icon>content_copy</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .password-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 300px;
      margin: auto;
    }

    .password-box {
      display: flex;
      width: 100%;
      align-items: center;
    }

    .password-box span.spacer {
      flex: 1;
    }

    .password {
      font-family: "Fira Code Light", "Fira Code", monospace;
      font-size: 120%;
    }
  `]
})
export class PasswordFieldComponent implements OnChanges {
  @Input({required: true}) password: string;
  hiddenPassword: string = '';
  hidePassword: boolean = true;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password'] && changes['password'].currentValue) {
      const passwordLength = changes['password'].currentValue.length;
      this.hiddenPassword = passwordLength > 20 ? '*'.repeat(20) + '…' : '*'.repeat(passwordLength);
    }
  }

  toggleHidePassword1() {
    this.hidePassword = !this.hidePassword;
  }

  copyPassword(password: string) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(password).then(() => {
          console.log('Password copied to clipboard');
        },
        err => {
          console.error('Failed to copy password: ', err);
        }
      );
    } else {
      this.fallbackCopyText(password);
    }
  }

  fallbackCopyText(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';  // Prevent scrolling to bottom of page in MS Edge.
    textarea.style.left = '-9999px'; // Move textarea out of the viewport
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
      console.log(`Fallback: Copying text command was ${msg}`);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textarea);
  }
}
