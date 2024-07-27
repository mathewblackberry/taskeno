import {Component, Input} from '@angular/core';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-code-display',
  standalone: true,
  imports: [
    MatButton
  ],
  template: `
    <div class="code-container">
      <button (click)="copyCode()" mat-stroked-button class="copy-button">Copy Config</button>
      <pre class="code-box" contenteditable="">{{ codeText }}</pre>
    </div>

  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto
    }

    .code-container {
      position: relative;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 48px 1em 1em;
      overflow-x: hidden;
      max-width: calc(100vw - 68px);
      display: flex;
      flex-direction: column;
      margin: 10px;
    }

    .code-box {
      flex: 1;
      font-family: 'Courier New', Courier, monospace;
      overflow-x: scroll;
      word-wrap: break-word;
      outline: none;
      background-color: rgba(255,255,255,0.25);
      border-radius: 5px;
      border: 1px solid #ccc;
      margin-top: 12px;
    }

    .code-box:focus {
      outline: none;
    }

    .copy-button {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 0.5em;
    }
  `]
})
export class CodeDisplayComponent {

  @Input({required: true})

  codeText: string;

  copyCode() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.codeText).then(
        () => {
          console.log('Text copied to clipboard');
        },
        err => {
          console.error('Failed to copy text: ', err);
        }
      );
    } else {
      // Fallback method for copying text
      this.fallbackCopyText();
    }
  }

  fallbackCopyText() {
    const textarea = document.createElement('textarea');
    textarea.value = this.codeText;
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
