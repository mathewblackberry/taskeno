import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, ValidationErrors, Validator, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {IPv4CidrRange} from 'ip-num';
import {Validator as IPValidator} from 'ip-num/Validator'
import {Observable, Subscription} from 'rxjs';

@Component({
  selector: 'app-ip-list-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule
  ],
  template: `
    <div [formGroup]="formGroup" class="form-array">
      <div formArrayName="items">
        @for (item of items.controls; let i = $index; let last = $last; track item) {
          <div [formGroupName]="i" class="array-item">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <input matInput formControlName="value"/>
              <mat-error *ngIf="item.get('value')?.hasError('required')">This field is required</mat-error>
              <mat-error *ngIf="item.get('value')?.hasError('invalidIP')">
                @if (type) {
                  A valid IP address with a CIDR (/xx) is required.
                } @else {
                  A valid IP address is required.
                }
              </mat-error>
            </mat-form-field>
            @if (last) {
              <button mat-icon-button type="button" (click)="addItem()" class="add-button">
                <mat-icon>add_circle</mat-icon>
              </button>
            }
            <button mat-icon-button type="button" (click)="removeItem(i)">
              <mat-icon color="warn">remove_circle</mat-icon>
            </button>
          </div>
        }
      </div>
    </div>

  `,
  styles: [`
    .form-array {
      display: flex;
      flex-direction: column;
    }

    .array-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    mat-form-field {
      flex: 1;
      margin: 3px 0;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ArrayEditorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ArrayEditorComponent),
      multi: true
    }
  ]
})
export class ArrayEditorComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() type: 'ip' | 'cidr range' | 'cidr notation' = 'ip';
  private _value: IPv4CidrRange[];
  formGroup: any = this.fb.group({
    items: this.fb.array([])
  });
  private onChange: (value: any) => void = () => {
  };
  private onTouched: () => void = () => {
  };
  private valueChangesSubscription: Subscription;

  get value(): IPv4CidrRange[] {
    return this._value;
  }

  set value(value: IPv4CidrRange[]) {
    if (value) {
      this._value = value;
    }
  }

  get items(): FormArray {
    return this.formGroup.get('items') as FormArray;
  }

  constructor(private fb: FormBuilder) {
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription.unsubscribe();
  }

  writeValue(value: IPv4CidrRange[]): void {
    if (value !== this._value) {
      this._value = value;
      this.formGroup.setControl('items', this.fb.array(value.map((value: IPv4CidrRange) => this.fb.group({value: [value, Validators.required, this.ipCidrValidator]}))));
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
    this.items.push(this.fb.group({value: ['', Validators.required, this.ipCidrValidator]}));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  ngOnInit(): void {
    this.valueChangesSubscription = this.formGroup.valueChanges.subscribe((value: any) => {
      this.onChange(value.items.map((item: any) => item.value));
    });
  }

  ipCidrValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
    return new Observable<ValidationErrors | null>(observer => {
      const value = control.value;
      if (!value) {
        observer.next(null);
        observer.complete();
        return;
      }
      let isValid = false;
      let message = [];
      if (this.type === 'cidr notation') {
        const valid = IPValidator.isValidIPv4CidrNotation(value);
        isValid = valid[0];
        message = valid[1];
      } else if (this.type === 'cidr range') {
        const valid = IPValidator.isValidIPv4CidrRange(value);
        isValid = valid[0];
        message = valid[1];
      } else {
        const valid = IPValidator.isValidIPv4String(value);
        isValid = valid[0];
        message = valid[1];
      }
      if (!isValid) {
        observer.next({invalidIP: {valid: false, message}});
      } else {
        observer.next(null);
      }
      observer.complete();
    });
  }
}
