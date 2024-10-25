import {Observable, ReplaySubject, Subject} from "rxjs";

export class ObservableWrapper<WrapperType> {
  private storage: Storage = localStorage;
  protected _value: WrapperType;
  protected _subject: Subject<WrapperType> = new ReplaySubject(1);
  public obs$: Observable<WrapperType> = this._subject.asObservable();

  constructor(value?: WrapperType) {
    if (typeof value !== 'undefined') {
      this._value = value;
      this._subject.next(value);
    }
  }

  get value(): WrapperType {
    return this._value;
  }

  set value(value: WrapperType) {
    this._value = value;
    this._subject.next(value);
  }

  next(): void {
    this._subject.next(this.value);
  }

  saveToLocalstorage(key: string){
    this.storage.setItem(key, JSON.stringify(this._value));
  }

}
