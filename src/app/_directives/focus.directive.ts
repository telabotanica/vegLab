import { Directive, Input, Inject, ElementRef, AfterContentInit } from '@angular/core';

@Directive({
  selector: '[vlFocus]'
})
export class FocusDirective implements AfterContentInit {
  @Input() public focus: boolean;
  public constructor(private element: ElementRef) { }

  ngAfterContentInit() {
    setTimeout(() => {
      this.element.nativeElement.focus();
    }, 500);
  }

}
