// filename: custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {Validator as IPValidator} from 'ip-num/Validator';
export class IPValidators {
  static ipCidrValidator(type: 'ip' | 'cidr range' | 'cidr notation'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null;
      }

      let isValid = false;
      let message = [];
      if (type === 'cidr notation') {
        const valid = IPValidator.isValidIPv4CidrNotation(value);
        isValid = valid[0];
        message = valid[1];
      } else if (type === 'cidr range') {
        const valid = IPValidator.isValidIPv4CidrRange(value);
        isValid = valid[0];
        message = valid[1];
      } else {
        const valid = IPValidator.isValidIPv4String(value);
        isValid = valid[0];
        message = valid[1];
      }

      return isValid ? null : { invalidIP: { valid: false, message } };
    };
  }
}
