import { WaitObservable } from "@_datas/api";
import { ParseInt } from "@_helpers/math";
import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { concatMap, filter, last, map, skipWhile, switchMap, takeUntil } from 'rxjs/operators';





@Directive({
  selector: '[appSwipe]'
})

export class SwipeDirective implements OnInit, OnDestroy {

  @Input() swipeDistance: number = 50;

  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();
  @Output() swipeUp = new EventEmitter<void>();
  @Output() swipeDown = new EventEmitter<void>();

  private destroyed$ = new Subject<void>();





  // Получить событие
  private getEvent(event: string): Observable<{ clientX: number, clientY: number }> {
    return WaitObservable(() => !this.el?.nativeElement).pipe(
      skipWhile(() => !this.el?.nativeElement),
      concatMap(() => fromEvent<TouchEvent>(this.el.nativeElement, event).pipe(
        takeUntil(this.destroyed$),
        map(event => ({
          clientX: ParseInt(event?.touches?.[0]?.clientX),
          clientY: ParseInt(event?.touches?.[0]?.clientY)
        }))
      ))
    );
  }





  constructor(
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    const touchStart$ = this.getEvent("touchstart");
    const touchMove$ = this.getEvent("touchmove");
    const touchEnd$ = this.getEvent("touchend");
    // Подписка на события
    touchStart$
      .pipe(
        switchMap(({ clientX: startX, clientY: startY }) => touchMove$.pipe(
          takeUntil(touchEnd$),
          last(),
          map(({ clientX: moveX, clientY: moveY }) => ({ startX, startY, moveX, moveY })),
          filter(({ startX, startY, moveX, moveY }) => Math.abs(moveX - startX) > this.swipeDistance || Math.abs(moveY - startY) > this.swipeDistance)
        ))
      )
      .subscribe(({ startX, startY, moveX, moveY }) => {
        if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
          if (moveX > startX) {
            this.swipeRight.emit();
          }
          // Свайп влево
          else {
            this.swipeLeft.emit();
          }
        }
        // Свайп вниз
        else if (moveY > startY) {
          this.swipeDown.emit();
        }
        // Свайп вверх
        else {
          this.swipeUp.emit();
        }
      });
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
