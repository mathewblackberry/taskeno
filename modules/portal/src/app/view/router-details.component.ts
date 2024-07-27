import {CommonModule} from '@angular/common';
import {Component, forwardRef, inject, Input, OnChanges} from '@angular/core';
import {ControlValueAccessor, FormBuilder, FormControl, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validator, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {CodeDisplayComponent} from '../code-display.component';
import {Asset, Site} from '../models/model';
import {PasswordFieldComponent} from '../password-field.component';
import {SiteAssetService} from '../services/site-asset-service';
import {BaseAssetComponent} from './base-asset';
import {CredentialsDetailsComponent} from './credentials.component';

@Component({
  selector: 'app-router-details',
  standalone: true,
  imports: [
    CodeDisplayComponent,
    MatButtonModule,
    MatTableModule,
    PasswordFieldComponent,
    CommonModule,
    CredentialsDetailsComponent,
    FormsModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule
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
              <div formGroupName="routerDetails">
                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <input matInput [formControlName]="element.field"/>

                  @if (assetForm.get('routerDetails.' + element.field)?.hasError('required')) {
                    <mat-error>{{ element.label }} is required</mat-error>
                  }
                  @if (assetForm.get('routerDetails.' + element.field)?.hasError('minlength')) {
                    <mat-error>Minimum length is {{ assetForm.get('routerDetails.' + element.field)?.getError('minlength').requiredLength }}</mat-error>
                  }
                  @if (assetForm.get('routerDetails.' + element.field)?.hasError('maxlength')) {
                    <mat-error>Maximum length is {{ assetForm.get('routerDetails.' + element.field)?.getError('maxlength').requiredLength }}</mat-error>
                  }
                  @if (assetForm.get('routerDetails.' + element.field)?.hasError('pattern')) {
                    <mat-error>Invalid format</mat-error>
                  }

                </mat-form-field>
              </div>
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

      @if (element && element.credentials) {

        <div formGroupName="routerDetails">
          <app-credentials-details formControlName="credentials" [isEditMode]="isEditMode"/>
        </div>
      }

    </form>
    <button mat-stroked-button class="edit-button" (click)="save()" [ngStyle]="{display: isEditMode ? 'block' : 'none'}" [disabled]="assetForm.invalid">Save</button>
    @if (config) {
      <app-code-display [codeText]="config!"/>
    } @else {
      <div class="right-align">
        <button mat-raised-button (click)="getConfig(site, element)" class="config-button">Get Config</button>
      </div>
    }
  `,
  styleUrl: './view.scss',
  styles: [`

  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RouterDetailsComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => RouterDetailsComponent),
      multi: true
    }
  ]
})
export class RouterDetailsComponent extends BaseAssetComponent {
  private siteAssetService: SiteAssetService = inject(SiteAssetService);
  @Input() displayedColumns: string[] = ['label', 'value'];
  @Input({required: true}) site: Site;
  @Input({required: true}) asset: Asset;

  config: string | null;

  getConfig(site: Site, asset: Asset) {
    this.siteAssetService.getAssetConfig(site.id, asset.id).subscribe(config => {
      this.config = config.body;
    });
  }

  protected updateDataSource(): void {
    if (this.element)
      this.dataSource = [
        {label: 'Manufacturer', field: 'manufacturer', value: this.element.manufacturer, required: true},
        {label: 'Model', field: 'model', value: this.element.model, required: true},
        {label: 'Serial Number', field: 'serialNumber', value: this.element.serialNumber}
        // {label: 'Credentials', field: 'credentials', value: this.asset.credentials.join(', ')}
      ];
  }

  protected override updateFormControls(): void {
    console.log('updating');
    console.log(JSON.stringify(this.element?.credentials, null, 2));
    const controls: { [key: string]: FormControl } = {};
    this.dataSource.forEach(item => {
      switch (item.field) {
        default:
          this.dataSource.forEach(item => {
            const validators = [];
            if (item.required)
              validators.push(Validators.required);
            if (item.min !== undefined)
              validators.push(Validators.minLength(item.min));
            if (item.max !== undefined)
              validators.push(Validators.maxLength(item.max));
            if (item.regexp !== undefined)
              validators.push(Validators.pattern(item.regexp));
            // @ts-ignore
            controls[item.field] = new FormControl(item.value || '', validators);
          });
      }
    });

    // @ts-ignore
    controls['credentials'] = [this.element?.credentials || [], Validators.required];

      this.assetForm = this.fb.group({routerDetails: this.fb.group(controls)});
  }

  protected mergeAssetWithFormValues(): void {
    const formValue = {...this.assetForm.value};
    console.log(JSON.stringify(formValue));
    Object.assign(this.element!, formValue);
    console.log(this.element)
  }

}
