import {CommonModule} from '@angular/common';
import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {Asset} from '../models/model';
import {PasswordFieldComponent} from '../password-field.component';
import {EditableBaseComponent} from './base-asset';
import {ArrayEditorComponent} from './ip-list-component';

@Component({
  selector: 'app-mobile-details',
  standalone: true,
  imports: [
    MatTableModule,
    PasswordFieldComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatIconButton,
    MatInputModule,
    CommonModule,
    ArrayEditorComponent
  ],
  template: `
    <form [formGroup]="mobileDetailsForm">
      <table mat-table [dataSource]="dataSource" class="mat-elevation-z8 no-header">
        <!-- Label Column -->
        <ng-container matColumnDef="label">
          <th mat-header-cell *matHeaderCellDef class="label-column"> Label</th>
          <td mat-cell *matCellDef="let element" class="label-column"><strong>{{ element.label }}</strong></td>
        </ng-container>

        <!-- Value Column -->
        <ng-container matColumnDef="value">
          <th mat-header-cell *matHeaderCellDef class="value-column"> Value</th>
          <td mat-cell *matCellDef="let element" class="value-column">
            @if (isEditMode) {
              @switch (element.field) {
                @case('framedRoutes'){
                  <app-ip-list-editor component="framedRoutes" [formGroup]="mobileDetailsForm" type="cidr range"></app-ip-list-editor>
                }
                @default {
                  <!--                  <div formGroupName="routerDetails">-->

                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [formControlName]="element.field"/>
                    @if (mobileDetailsForm.get(element.field)?.hasError('required')) {
                      <mat-error>{{ element.label }} is required</mat-error>
                    }
                    @if (mobileDetailsForm.get(element.field)?.hasError('minlength')) {
                      <mat-error>Minimum length is {{ mobileDetailsForm.get(element.field)?.getError('minlength').requiredLength }}</mat-error>
                    }
                    @if (mobileDetailsForm.get(element.field)?.hasError('maxlength')) {
                      <mat-error>Maximum length is {{ mobileDetailsForm.get(element.field)?.getError('maxlength').requiredLength }}</mat-error>
                    }
                    @if (mobileDetailsForm.get(element.field)?.hasError('pattern')) {
                      <mat-error>Invalid format</mat-error>
                    }
                  </mat-form-field>
                  <!--                  </div>-->
                }
              }
            } @else {
              @if (element.label.toLowerCase().includes('password') || element.label === 'PUK') {
                <app-password-field [password]="mobileDetailsForm.get(element.field)?.value"></app-password-field>
              } @else {
                {{ mobileDetailsForm.get(element.field)?.value }}
              }
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns" class="label-column"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="value-column"></tr>
      </table>
    </form>
  `,
  styleUrl: './view.scss',
  styles: [``],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MobileDetailsComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MobileDetailsComponent),
      multi: true
    }
  ]
})
export class MobileDetailsComponent extends EditableBaseComponent implements OnInit {
  @Input() displayedColumns: string[] = ['label', 'value'];
  @Input({required: true}) asset: Asset;
  @Input({required: true}) mobileDetailsForm: FormGroup;
  @Input() isEditMode = false;


  ngOnInit(): void {
    if (this.mobileDetailsForm) {
      this.dataSource = [
        {label: 'Username', field: 'username', value: this.mobileDetailsForm.get('username')?.value},
        {label: 'Password', field: 'password', value: this.mobileDetailsForm.get('password')?.value},
        {label: 'First Name', field: 'firstName', value: this.mobileDetailsForm.get('firstName')?.value},
        {label: 'Last Name', field: 'lastName', value: this.mobileDetailsForm.get('lastName')?.value},
        {label: 'SIM Serial', field: 'simSerial', value: this.mobileDetailsForm.get('simSerial')?.value},
        {label: 'Mobile Number', field: 'mobileNumber', value: this.mobileDetailsForm.get('mobileNumber')?.value},
        {label: 'PUK', field: 'PUK', value: this.mobileDetailsForm.get('PUK')?.value},
        {label: 'Framed IP', field: 'framedIP', value: this.mobileDetailsForm.get('framedIP')?.value},
        {label: 'Framed Routes', field: 'framedRoutes', value: this.mobileDetailsForm.get('framedRoutes')?.value.join(', ')}
      ];
    }
  }

  public save(): void {
    if (this.mobileDetailsForm.valid)
      console.log('Saving asset:', JSON.stringify(this.mobileDetailsForm.value, null, 2));
  }
}
