import {CommonModule} from '@angular/common';
import {Component, forwardRef, Input} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {CodeDisplayComponent} from '../code-display.component';
import {PasswordFieldComponent} from '../password-field.component';

@Component({
  selector: 'app-credentials-details',
  standalone: true,
  imports: [
    CodeDisplayComponent,
    MatButtonModule,
    MatTableModule,
    PasswordFieldComponent,
    CommonModule,
    FormsModule,
    MatError,
    MatFormField,
    MatInput,
    ReactiveFormsModule
  ],
  template: `

    <form [formGroup]="formGroup">
      <table mat-table [dataSource]="credentials.controls" formArrayName="credentials" class="mat-elevation-z8">
        <!-- Label Column -->
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef class="username-column">Username</th>
          <td mat-cell *matCellDef="let element; let i=index" class="username-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic" [formGroupName]="i">
                <input matInput formControlName="username"/>
                <mat-error *ngIf="credentials.at(i).get('username')?.hasError('required')">Username is required</mat-error>
                <mat-error *ngIf="credentials.at(i).get('username')?.hasError('minlength')">Minimum length is {{ credentials.at(i).get('username')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentials.at(i).get('username')?.hasError('maxlength')">Maximum length is {{ credentials.at(i).get('username')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentials.at(i).get('username')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              {{ credentials.at(i).get('username')?.value }}
            }
          </td>
        </ng-container>
        <!-- Value Column -->
        <ng-container matColumnDef="password">
          <th mat-header-cell *matHeaderCellDef class="password-column">Password</th>
          <td mat-cell *matCellDef="let element; let i=index" class="password-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic" [formGroupName]="i">
                <input matInput type="password" formControlName="password"/>
                <mat-error *ngIf="credentials.at(i).get('password')?.hasError('required')">Password is required</mat-error>
                <mat-error *ngIf="credentials.at(i).get('password')?.hasError('minlength')">Minimum length is {{ credentials.at(i).get('password')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentials.at(i).get('password')?.hasError('maxlength')">Maximum length is {{ credentials.at(i).get('password')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentials.at(i).get('password')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              @if (credentials.at(i).get('password')?.value) {
                <ng-container>
                  <app-password-field [password]="credentials.at(i).get('password')?.value"></app-password-field>
                </ng-container>
              } @else {
                **********
              }
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="purpose">
          <th mat-header-cell *matHeaderCellDef class="purpose-column">Purpose</th>
          <td mat-cell *matCellDef="let element; let i=index" class="purpose-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic" [formGroupName]="i">
                <input matInput formControlName="purpose"/>
                <mat-error *ngIf="credentials.at(i).get('purpose')?.hasError('required')">Purpose is required</mat-error>
                <mat-error *ngIf="credentials.at(i).get('purpose')?.hasError('minlength')">Minimum length is {{ credentials.at(i).get('purpose')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentials.at(i).get('purpose')?.hasError('maxlength')">Maximum length is {{ credentials.at(i).get('purpose')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="credentials.at(i).get('purpose')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              {{ credentials.at(i).get('purpose')?.value }}
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </form>

  `,
  styleUrl: './view.scss',
  styles: [`
    :host {
    }


  `]
})
export class CredentialsDetailsComponent {
  @Input() isEditMode = false;
  @Input() displayedColumns: string[] = ['username', 'password', 'purpose'];
  @Input() formGroup: FormGroup

  get credentials(): FormArray {
    return this.formGroup.get('credentials') as FormArray;
  }

  constructor(private fb: FormBuilder) {
  }

  addItem(): void {
    this.credentials.push(this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      purpose: ['']
    }));
  }

  removeItem(index: number): void {
    this.credentials.removeAt(index);
  }

  save(): void {
  }
}
