import {CommonModule} from '@angular/common';
import {Component, forwardRef, Input} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckbox, MatCheckboxModule} from '@angular/material/checkbox';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatInput, MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {CodeDisplayComponent} from '../code-display.component';
import {PasswordFieldComponent} from '../password-field.component';

@Component({
  selector: 'app-default-credentials-detail',
  standalone: true,
  imports: [
    CodeDisplayComponent,
    MatButtonModule,
    MatTableModule,
    PasswordFieldComponent,
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatIconModule
  ],
  template: `

    <form [formGroup]="credentialFormGroup">
      <div class="hosts-container">
        <!-- Header Row -->
        <div class="header-row">
          <div class="header-cell username-column">Username</div>
                    <div class="header-cell password-column">Password</div>
                    <div class="header-cell purpose-column">Purpose</div>
        </div>

        <!-- Data Rows -->
        <div class="data-row">
          <div class="data-cell username-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <input matInput formControlName="username"/>
                <mat-error *ngIf="credentialFormGroup.get('username')?.hasError('required')">Username is required</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('username')?.hasError('minlength')">Minimum length is {{ credentialFormGroup.get('username')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('username')?.hasError('maxlength')">Maximum length is {{ credentialFormGroup.get('username')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('username')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              <strong>{{ credentialFormGroup.get('username')?.value }}</strong>
            }
          </div>

          <div class="data-cell password-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <input matInput type="password" formControlName="password"/>
                <mat-error *ngIf="credentialFormGroup.get('password')?.hasError('required')">Username is required</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('password')?.hasError('minlength')">Minimum length is {{ credentialFormGroup.get('password')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('password')?.hasError('maxlength')">Maximum length is {{ credentialFormGroup.get('password')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('password')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              @if (credentialFormGroup.get('password')?.value) {
                <ng-container>
                  <app-password-field [password]="credentialFormGroup.get('password')?.value"></app-password-field>
                </ng-container>
              } @else {
                **********
              }
            }
          </div>

          <div class="data-cell purpose-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <input matInput formControlName="purpose"/>
                <mat-error *ngIf="credentialFormGroup.get('purpose')?.hasError('required')">Username is required</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('purpose')?.hasError('minlength')">Minimum length is {{ credentialFormGroup.get('purpose')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('purpose')?.hasError('maxlength')">Maximum length is {{ credentialFormGroup.get('purpose')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentialFormGroup.get('purpose')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
             {{ credentialFormGroup.get('purpose')?.value }}
            }
          </div>
        </div>

      </div>
    </form>

  `,
  styleUrl: './view.scss',
  styles: [`


  `]
})
export class CredentialDetailsComponent {
  @Input() isEditMode = false;
  @Input() credentialFormGroup: FormGroup


}
