import {CommonModule} from '@angular/common';
import {Component, inject, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {CodeDisplayComponent} from '../code-display.component';
import {Asset, Site} from '../models/model';
import {PasswordFieldComponent} from '../password-field.component';
import {AuthService} from '../services/auth-service';
import {SiteAssetService} from '../services/site-asset-service';
import {EditableBaseComponent} from './base-asset';
import {CredentialDetailsComponent} from './credential.component';
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
    ReactiveFormsModule,
    CredentialDetailsComponent,
    MatTabsModule
  ],
  template: `
    <form [formGroup]="routerDetailsForm">
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
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <input matInput [formControlName]="element.field"/>
                @if (routerDetailsForm.get(element.field)?.hasError('required')) {
                  <mat-error>{{ element.label }} is required</mat-error>
                }
                @if (routerDetailsForm.get(element.field)?.hasError('minlength')) {
                  <mat-error>Minimum length is {{ routerDetailsForm.get(element.field)?.getError('minlength').requiredLength }}</mat-error>
                }
                @if (routerDetailsForm.get(element.field)?.hasError('maxlength')) {
                  <mat-error>Maximum length is {{ routerDetailsForm.get(element.field)?.getError('maxlength').requiredLength }}</mat-error>
                }
                @if (routerDetailsForm.get(element.field)?.hasError('pattern')) {
                  <mat-error>Invalid format</mat-error>
                }
              </mat-form-field>
            } @else {
              @if (element.label.toLowerCase().includes('password') || element.label === 'PUK') {
                <app-password-field [password]="routerDetailsForm.get(element.field)?.value"></app-password-field>
              } @else {
                {{ routerDetailsForm.get(element.field)?.value }}
              }
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns" class="label-column"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="value-column"></tr>
      </table>
      <h3 class="mat-title-medium px-2">Credentials</h3>
      <mat-tab-group>

        @if (routerDetailsForm.get('credentials')) {
          <mat-tab label="Active">
            <app-credentials-details [formGroup]="routerDetailsForm" [isEditMode]="isEditMode"/>
          </mat-tab>
        }

        @if (defaultCredentials) {
          <mat-tab label="Default">
            <app-default-credentials-detail [credentialFormGroup]="defaultCredentials" [isEditMode]="isEditMode"/>
          </mat-tab>

        }

      </mat-tab-group>




    </form>
    @if (authService.isAdmin$ | async) {
      @if (config) {
        <app-code-display [codeText]="config!"/>
      } @else {
        <div class="right-align">
          <button mat-raised-button (click)="getConfig(site, asset)" class="config-button">Get Config</button>
        </div>
      }
    }
  `,
  styleUrl: './view.scss',
  styles: [`
    :host {
      height: 100%;
    }
  `]
})
export class RouterDetailsComponent extends EditableBaseComponent implements OnInit, OnChanges {

  private siteAssetService: SiteAssetService = inject(SiteAssetService);
  @Input() displayedColumns: string[] = ['label', 'value'];
  @Input({required: true}) site: Site;
  @Input({required: true}) asset: Asset;
  @Input({required: true}) routerDetailsForm: FormGroup;
  @Input() isEditMode: boolean = false;
  config: string | null;

  authService: AuthService = inject(AuthService);

  getConfig(site: Site, asset: Asset) {
    this.siteAssetService.getAssetConfig(site.id, asset.id).subscribe(config => {
      this.config = config.body;
    });
  }

  get defaultCredentials(): FormGroup {
    return this.routerDetailsForm.get('defaultCredentials') as FormGroup;
  }

  ngOnInit(): void {

    this.dataSource = [
      {label: 'Manufacturer', field: 'manufacturer', value: this.routerDetailsForm.get('manufacturer')?.value},
      {label: 'Model', field: 'model', value: this.routerDetailsForm.get('model')?.value},
      {label: 'Serial Number', field: 'serialNumber', value: this.routerDetailsForm.get('serialNumber')?.value}
    ];
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['asset']) {
      this.config = null;
    }
  }

  public override save(): void {
    if (this.routerDetailsForm.valid)
      console.log('Saving asset:', JSON.stringify(this.routerDetailsForm.value, null, 2));
  }

}
