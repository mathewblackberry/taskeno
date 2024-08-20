import {OnChanges, SimpleChanges, Input, Injectable, Directive, Component, inject} from '@angular/core';
import {ControlValueAccessor, FormBuilder, FormGroup, Validators, Validator, AbstractControl, ValidationErrors, FormControl} from '@angular/forms';
import {Asset, AssetDataElement} from '../models/model';

@Injectable()
export abstract class BaseAssetComponent implements OnChanges, ControlValueAccessor, Validator {
  element: any;
  assetForm: FormGroup;
  isEditMode = false;
  dataSource: AssetDataElement[] = [];

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // protected fb: FormBuilder = inject(FormBuilder);

  constructor(protected fb: FormBuilder) {
    this.assetForm = this.fb.group({});
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['element']) {
      this.updateDataSource();
      this.updateFormControls();
      this.onChange(this.element);
    }
  }

  writeValue(value: any): void {
    if (value) {
      this.element = value;
      this.updateDataSource();
      this.updateFormControls();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.assetForm.disable();
    } else {
      this.assetForm.enable();
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return this.assetForm.valid ? null : { invalidForm: { valid: false, message: 'Asset form is invalid' } };
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.mergeAssetWithFormValues();
      this.onChange(this.element);
    }
  }

  save(): void {
    if (this.assetForm.valid)
      console.log('Saving asset:', JSON.stringify(this.assetForm.value, null, 2));
      this.mergeAssetWithFormValues();
  }

  protected abstract mergeAssetWithFormValues(): void;

  protected abstract updateDataSource(): void;

  protected abstract updateFormControls(): void;

}


export abstract class EditableBaseComponent {
  dataSource: AssetDataElement[] = [];

  public abstract save(): void ;
}
