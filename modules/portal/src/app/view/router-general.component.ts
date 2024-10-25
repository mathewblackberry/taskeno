import {CommonModule} from '@angular/common';
import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormArray, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {Asset} from '../models/model';
import {PasswordFieldComponent} from '../password-field.component';
import {EditableBaseComponent} from './base-asset';
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
    <form [formGroup]="routerGeneralForm">
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
                  <app-ip-list-editor component="loopbacks" [formGroup]="routerGeneralForm" type="ip"></app-ip-list-editor>
                }
                @case ('wanSubnets') {
                  <app-ip-list-editor component="wanSubnets" [formGroup]="routerGeneralForm" type="cidr notation"></app-ip-list-editor>
                }
                @case('active'){

                }
                @default {
                  <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                    <input matInput [formControlName]="element.field"/>
                    @if (routerGeneralForm.get(element.field)?.hasError('required')) {
                      <mat-error>{{ element.label }} is required</mat-error>
                    }
                    @if (routerGeneralForm.get(element.field)?.hasError('minlength')) {
                      <mat-error>Minimum length is {{ routerGeneralForm.get(element.field)?.getError('minlength').requiredLength }}</mat-error>
                    }
                    @if (routerGeneralForm.get(element.field)?.hasError('maxlength')) {
                      <mat-error>Maximum length is {{ routerGeneralForm.get(element.field)?.getError('maxlength').requiredLength }}</mat-error>
                    }
                    @if (routerGeneralForm.get(element.field)?.hasError('pattern')) {
                      <mat-error>Invalid format</mat-error>
                    }
                  </mat-form-field>
                }
              }
            } @else {
              @if (element.label.toLowerCase().includes('password') || element.label === 'PUK') {
                <app-password-field [password]="routerGeneralForm.get(element.field)?.value"></app-password-field>
              } @else {
                {{ routerGeneralForm.get(element.field)?.value }}
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
export class RouterGeneralComponent extends EditableBaseComponent implements OnInit {

  @Input() displayedColumns: string[] = ['label', 'value'];
  @Input({required: true}) asset: Asset;
  @Input({required: true}) routerGeneralForm: FormGroup;
  @Input() isEditMode: boolean = false;

  ngOnInit(): void {
    this.dataSource = [
      {label: 'Host Name', field: 'hostname', value: this.routerGeneralForm.get('hostname')?.value},
      {label: 'Terminals', field: 'terminals', value: this.routerGeneralForm.get('terminals')?.value},
      {label: 'Telstra FNN', field: 'FNN', value: this.routerGeneralForm.get('FNN')?.value ?? 'N/A'},
      {label: 'Carriage Type', field: 'carriageType', value: this.routerGeneralForm.get('carriageType')?.value},
      {label: 'Carriage FNN', field: 'carriageFNN', value: this.routerGeneralForm.get('carriageFNNN')?.value ?? 'N/A'},
      {label: 'Carriage Port', field: 'carriagePort', value: this.routerGeneralForm.get('carriagePort')?.value ?? 'N/A'},
      {label: 'NBN POI', field: 'POI', value: this.routerGeneralForm.get('POI')?.value},
      {label: 'Loopbacks', field: 'loopbacks', value: this.routerGeneralForm.get('loopbacks')?.value.join(', ')},
      {label: 'WAN Subnets', field: 'wanSubnets', value: this.routerGeneralForm.get('wanSubnets')?.value.join(', ')}
    ];
  }

  get loopbacks(): FormArray {
    return this.routerGeneralForm.get('loopbacks') as FormArray;
  }

  get wanSubnets(): FormArray {
    return this.routerGeneralForm.get('wanSubnets') as FormArray;
  }

  public override save(): void {
    if (this.routerGeneralForm.valid)
      console.log('Saving asset:', JSON.stringify(this.routerGeneralForm.value, null, 2));
  }

}
