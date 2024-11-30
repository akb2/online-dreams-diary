import { WaitObservable } from "@_helpers/rxjs";
import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Subject, filter, fromEvent, merge, mergeMap, takeUntil, tap, timer } from "rxjs";





@Directive({
  selector: "[mousePress]"
})

export class MousePressDirective implements OnInit, OnDestroy {

  @Input() pressInterval: number = 25;

  @Output() mouseDown: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();
  @Output() mouseUp: EventEmitter<Event | MouseEvent | TouchEvent> = new EventEmitter();
  @Output() mousePress: EventEmitter<void> = new EventEmitter();
  @Output() mouseMovePress: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();
  @Output() mouseMoveUnPress: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();

  private mousePressing: boolean = false;

  private destroyed$: Subject<void> = new Subject();





  constructor(
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.eventsListener();
    this.cycleMouseListener();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Прослушивание событий мышки
  private eventsListener() {
    WaitObservable(() => !this.elementRef?.nativeElement)
      .pipe(
        mergeMap(() => merge(
          fromEvent<MouseEvent>(this.elementRef.nativeElement, "mousedown").pipe(tap(event => this.onMouseDown(event))),
          fromEvent<TouchEvent>(this.elementRef.nativeElement, "touchstart").pipe(tap(event => this.onMouseDown(event))),
          fromEvent<MouseEvent>(document, "mouseup").pipe(tap(event => this.onMouseUp(event))),
          fromEvent<TouchEvent>(document, "touchend").pipe(tap(event => this.onMouseUp(event))),
          fromEvent<Event>(window, "blur").pipe(tap(event => this.onMouseUp(event))),
          fromEvent<Event>(window, "visibilitychange").pipe(filter(() => document.visibilityState === "hidden"), tap(event => this.onMouseUp(event))),
          fromEvent<MouseEvent>(document, "mousemove").pipe(tap(event => this.onMouseMove(event))),
          fromEvent<TouchEvent>(document, "touchmove").pipe(tap(event => this.onMouseMove(event)))
        )),
        takeUntil(this.destroyed$)
      )
      .subscribe();

  }

  // Циклическое событие мышки
  private cycleMouseListener() {
    timer(0, this.pressInterval)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.onMousePress());
  }





  // Мышка зажата
  private onMouseDown(event: MouseEvent | TouchEvent): void {
    this.mousePressing = true;
    // Событие
    this.mouseDown.emit(event);
  }

  // Мышка отпущена
  private onMouseUp(event: Event | MouseEvent | TouchEvent): void {
    this.mousePressing = false;
    // Событие
    this.mouseUp.emit(event);
  }

  // Действие пока мышка зажата
  private onMousePress(): void {
    if (this.mousePressing) {
      this.mousePress.emit();
    }
  }

  // Перемещение мышки
  private onMouseMove(event: MouseEvent | TouchEvent): void {
    if (this.mousePressing) {
      this.mouseMovePress.emit(event);
    }
    // Мышка отпущена
    else {
      this.mouseMoveUnPress.emit(event);
    }
  }
}
