import { Directive, Input, Optional, Self, DoCheck } from "@angular/core";
import { ControlValueAccessor, NgControl, FormControl, ValidationErrors } from "@angular/forms";





@Directive()





export abstract class BaseInputDirective implements ControlValueAccessor, DoCheck {


  @Input() label: string;
  @Input() errors: { [key: string]: string } = {};

  value: any;
  text: string;
  disabled: boolean = false;
  required: boolean = false;

  get control(): FormControl {
    return this.controlDir.control as FormControl;
  }

  onChange: Function = (_: any) => { };
  onTouched: Function = () => { };





  // Конструктор
  constructor(
    @Optional() @Self() public controlDir: NgControl
  ) {
    controlDir.valueAccessor = this;
  }

  ngDoCheck(): void {
    if (this.controlDir.control instanceof FormControl) {
      const validator: ValidationErrors = this.controlDir.control.validator && this.controlDir.control.validator(new FormControl(""));
      this.required = !!validator && validator.hasOwnProperty("required");

      if (this.required) {
        this.errors.required = this.errors.required || "validation.required";
      }
    }
  }





  getErrorMessageKey(): string {
    const controlErrkeys: string[] = Object.keys(this.controlDir.control.errors);
    const declaredErrKeys: string[] = Object.keys(this.errors);

    if (controlErrkeys.some((key) => declaredErrKeys.includes(key))) {
      return this.errors[controlErrkeys[0]];
    }

    return "";
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (_: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
