import {CommonModule} from '@angular/common';
import {Component, forwardRef, Input} from '@angular/core';
import {FormArray, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {Asset} from '../models/model';
import {PasswordFieldComponent} from '../password-field.component';
import {BaseAssetComponent} from './base-asset';
import {ArrayEditorComponent} from './ip-list-component';

@Component({
  selector: 'app-router-general',
  standalone: true,
  imports: [
    MatTableModule,
    PasswordFieldComponent,
    ReactiveFormsModule,
    MatButtonModule, MatIconModule, CommonModule, MatInputModule, ArrayEditorComponent
  ],
  template: `
    <button mat-icon-button (click)="toggleEditMode()" class="edit-button">
      @if (isEditMode) {
        <mat-icon>close</mat-icon>
      } @else {
        <mat-icon>edit</mat-icon>
      }
    </button>
    <form [formGroup]="assetForm">
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
                @case ('loopbacks') {
                  <app-ip-list-editor formControlName="loopbacks" type="ip"></app-ip-list-editor>
                }
                @case ('wanSubnets') {
                  <app-ip-list-editor formControlName="wanSubnets" type="cidr notation"></app-ip-list-editor>
                }
                @default {
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [formControlName]="element.field"/>
                    <mat-error *ngIf="assetForm.controls[element.field].hasError('required')">{{ element.label }} is required</mat-error>
                    <mat-error *ngIf="assetForm.controls[element.field].hasError('minlength')">Minimum length is {{ assetForm.controls[element.field].getError('minlength').requiredLength }}</mat-error>
                    <mat-error *ngIf="assetForm.controls[element.field].hasError('maxlength')">Maximum length is {{ assetForm.controls[element.field].getError('maxlength').requiredLength }}</mat-error>
                    <mat-error *ngIf="assetForm.controls[element.field].hasError('pattern')">Invalid format</mat-error>
                  </mat-form-field>
                }
              }
            } @else {
              @if (element.label.toLowerCase().includes('password') || element.label === 'PUK') {
                <app-password-field [password]="element.value"></app-password-field>
              } @else {
                {{ element.value }}
              }
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns" class="label-column"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="value-column"></tr>
      </table>
    </form>
    <button mat-stroked-button class="edit-button" (click)="save()" [ngStyle]="{display: isEditMode ? 'block' : 'none'}" [disabled]="assetForm.invalid">Save</button>
  `,
  styleUrl: './view.scss',
  styles: [` `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RouterGeneralComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => RouterGeneralComponent),
      multi: true
    }
  ]
})
export class RouterGeneralComponent extends BaseAssetComponent {
  @Input() displayedColumns: string[] = ['label', 'value'];
  @Input({required: true}) asset: Asset;
  protected updateDataSource(): void {
    this.dataSource = [
      {label: 'Host Name', field: 'hostname', value: this.element.hostname},
      {label: 'Terminals', field: 'terminals', value: this.element.terminals?.toString()},
      {label: 'Telstra FNN', field: 'FNN', value: this.element.FNN?.toString() ?? 'N/A'},
      {label: 'Carriage Type', field: 'carriageType', value: this.element.carriageType?.toString()},
      {label: 'Carriage Port', field: 'carriagePort', value: this.element.carriagePort?.toString() ?? 'N/A'},
      {label: 'NBN POI', field: 'POI', value: this.element.POI?.toString()},
      {label: 'Loopbacks', field: 'loopbacks', value: this.element.loopbacks?.join(', ')},
      {label: 'WAN Subnets', field: 'wanSubnets', value: this.element.wanSubnets?.join(', ')}
    ];
  }

  protected override updateFormControls(): void {
    console.log(this.dataSource);
    const controls: { [key: string]: FormControl } = {};
    this.dataSource.forEach(item => {
      switch (item.field) {
        case 'loopbacks':
          // @ts-ignore
          controls['loopbacks'] = [this.element.loopbacks || [], Validators.required];
          break;
        case 'wanSubnets':
          //@ts-ignore
          controls['wanSubnets'] = [this.element.wanSubnets || [], Validators.required];
          break;
        default:
          this.dataSource.forEach(item => {
            const validators = [];
            if (item.required)
              validators.push(Validators.required);
            if (item.min !== undefined)
              validators.push(Validators.minLength(item.min));
            if(item.max !== undefined)
              validators.push(Validators.maxLength(item.max));
            if(item.regexp !== undefined)
              validators.push(Validators.pattern(item.regexp));

            // @ts-ignore
            controls[item.field] = new FormControl(item.value || '', validators);
          });
      }
    });
    this.assetForm = this.fb.group(controls);
  }

  get loopbacks(): FormArray {
    return this.assetForm.get('loopbacks') as FormArray;
  }

  get wanSubnets(): FormArray {
    return this.assetForm.get('wanSubnets') as FormArray;
  }

  protected mergeAssetWithFormValues(): void {
    const formValue = {...this.assetForm.value};
    console.log(JSON.stringify(formValue));
    formValue.loopbacks = this.assetForm.get('loopbacks')?.value.map((item: any) => item.value) || [];
    formValue.wanSubnets = this.assetForm.get('wanSubnets')?.value.map((item: any) => item.value) || [];
    Object.assign(this.asset, formValue);
  }

}
