import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, forwardRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormArray, FormBuilder, FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatTableModule} from '@angular/material/table';
import {Subscription} from 'rxjs';
import {CodeDisplayComponent} from '../code-display.component';
import {Credential} from '../models/model';
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
    <h3 class="mat-title-medium px-2">Credentials</h3>
    <form [formGroup]="formGroup">
      <table mat-table [dataSource]="items.controls" formArrayName="items" class="mat-elevation-z8">
        <!-- Label Column -->
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef class="username-column">Username</th>
          <td mat-cell *matCellDef="let element; let i=index" class="username-column">
            @if (isEditMode) {
              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic" [formGroupName]="i">
                <input matInput formControlName="username"/>
                <mat-error *ngIf="element.get('username')?.hasError('required')">Username is required</mat-error>
                <mat-error *ngIf="element.get('username')?.hasError('minlength')">Minimum length is {{ items.at(i)?.get('username')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="element.get('username')?.hasError('maxlength')">Maximum length is {{ items.at(i)?.get('username')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="element.get('username')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              <strong>{{ items.at(i)?.get('username')?.value }}</strong>
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
                <mat-error *ngIf="items.at(i)?.get('password')?.hasError('required')">Password is required</mat-error>
                <mat-error *ngIf="items.at(i)?.get('password')?.hasError('minlength')">Minimum length is {{ items.at(i)?.get('password')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="items.at(i)?.get('password')?.hasError('maxlength')">Maximum length is {{ items.at(i)?.get('password')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="items.at(i)?.get('password')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>

            } @else {
              @if (items.at(i)?.get('password')?.value) {
                <ng-container>
                  <app-password-field [password]="items.at(i)?.get('password')?.value"></app-password-field>
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
                <mat-error *ngIf="items.at(i)?.get('purpose')?.hasError('required')">Purpose is required</mat-error>
                <mat-error *ngIf="items.at(i)?.get('purpose')?.hasError('minlength')">Minimum length is {{ items.at(i)?.get('purpose')?.getError('minlength').requiredLength }}</mat-error>
                <mat-error *ngIf="items.at(i)?.get('purpose')?.hasError('maxlength')">Maximum length is {{ items.at(i)?.get('purpose')?.getError('maxlength').requiredLength }}</mat-error>
                <mat-error *ngIf="items.at(i)?.get('purpose')?.hasError('pattern')">Invalid format</mat-error>
              </mat-form-field>
            } @else {
              <strong>{{ items.at(i)?.get('purpose')?.value }}</strong>
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
      height: 100%;
    }

    .username-column {
      width: 250px;
    }

    .password-column {
      width: 400px;
    }


  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CredentialsDetailsComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CredentialsDetailsComponent),
      multi: true
    }
  ]
})
export class CredentialsDetailsComponent implements OnChanges, ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() isEditMode = false;
  @Input() displayedColumns: string[] = ['username', 'password', 'purpose'];
  dataSource: { username: string, password: string | undefined | null, purpose: string | undefined | null }[] = [];
  // @Input({required: true}) credentials: Credential[] | undefined;
  formGroup: any = this.fb.group({
    items: this.fb.array([])
  });
  get items(): FormArray {
    return this.formGroup.get('items') as FormArray;
  }
  private _value: Credential[];

  private onChange: (value: any) => void = () => {
  };
  private onTouched: () => void = () => {
  };
  private valueChangesSubscription: Subscription;

  get value(): Credential[] {
    return this._value;
  }

  set value(value: Credential[]) {
    if (value) {
      this._value = value;
    }
  }

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['credentials']) {
      this.dataSource = [];
      this.value?.forEach(cred => {
        this.dataSource.push({username: cred.username, password: cred.password, purpose: cred.purpose});
      });

    }
  }

  writeValue(value: Credential[]): void {
    if (value) {
      console.log(value);
      this._value = value;
      this.formGroup.setControl('items', this.fb.array(value.map((cred: Credential) => {
        return this.fb.group({
          username: [cred.username, Validators.required],
          password: [cred.password, Validators.required],
          purpose: [cred.purpose]
        })})));
      this.valueChangesSubscription = this.formGroup.valueChanges.subscribe((value: any) => {
        // this.onChange(value.items.map((item: any) => item));
        this.onChange(value.items);
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.formGroup.disable() : this.formGroup.enable();
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.formGroup.valid ? null : {invalidForm: {valid: false, message: "Array form is invalid"}};
  }

  addItem(): void {
    this.items.push(this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      purpose: ['']
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  ngOnInit(): void {
    // this.valueChangesSubscription = this.formGroup.valueChanges.subscribe((value: any) => {
    //   // this.onChange(value.items.map((item: any) => item));
    //   this.onChange(value.items);
    // });
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription.unsubscribe();
  }
}
