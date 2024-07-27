import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanReadableBytes',
  standalone: true
})
export class HumanReadableBytesPipe implements PipeTransform {

  transform(value: number | string, decimals: number = 2): string {
    // Convert string to number if necessary
    let numericValue: number;
    if (typeof value === 'string') {
      numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        throw new Error(`Invalid value: '${value}' is not a valid number.`);
      }
    } else {
      numericValue = value;
    }

    if (numericValue === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(numericValue) / Math.log(k));

    return parseFloat((numericValue / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}


  @Pipe({
  name: 'bool',
  standalone: true
})
export class BooleanConverterPipe implements PipeTransform {
  transform(value: string): boolean {
    return value === 'true';
  }
}
