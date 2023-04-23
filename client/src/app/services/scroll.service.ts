import { WaitObservable } from "@_datas/api";
import { ScrollElement } from "@_datas/app";
import { CheckInRange, ParseInt } from "@_helpers/math";
import { CreateRandomID } from "@_helpers/string";
import { XYCoord } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";
import { ScrollData, SetScrollData } from "@_models/screen";
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, filter, fromEvent, map, merge, mergeMap, of, switchMap, take, takeUntil, takeWhile, tap, throwError, timeout, timer } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class ScrollService implements OnDestroy {

  private scrollElement: HTMLElement;

  private emitEvent: boolean = true;
  private scrollSpeedByStep: number = 10;
  private scrollMaxTime: number = 600;
  private scrollStepShift: number = 50;
  private scrollInterruptTime: number = 50;
  private saveScrollInterruptTime: number = 1500;

  private scrollEventLastId: string;
  private scrollLastX: number;
  private scrollLastY: number;
  private scrollLastTime: number = 0;
  private addingScrollY: number = 0;

  private scrollStartEvent$: BehaviorSubject<ScrollData> = new BehaviorSubject(null);
  private scrollEvent$: BehaviorSubject<ScrollData> = new BehaviorSubject(null);
  private scrollEndEvent$: BehaviorSubject<ScrollData> = new BehaviorSubject(null);
  private scrollAlwaysStartEvent$: BehaviorSubject<ScrollData> = new BehaviorSubject(null);
  private scrollAlwaysEvent$: BehaviorSubject<ScrollData> = new BehaviorSubject(null);
  private scrollAlwaysEndEvent$: BehaviorSubject<ScrollData> = new BehaviorSubject(null);
  private destroyed$: Subject<void> = new Subject();





  // Текущий скролл
  get getCurrentScroll(): ScrollData {
    const elm: HTMLElement = this.scrollElement;
    const x: number = ParseInt(Math.ceil(elm?.scrollLeft) ?? 0);
    const y: number = ParseInt(Math.ceil(elm?.scrollTop) ?? 0);
    const maxX: number = ParseInt((elm?.scrollWidth - elm?.clientWidth) ?? 0);
    const maxY: number = ParseInt((elm?.scrollHeight - elm?.clientHeight) ?? 0);
    const lastDirectionX: NumberDirection = this.scrollLastX < x ? 1 : (this.scrollLastX > x ? -1 : 0);
    const lastDirectionY: NumberDirection = this.scrollLastY < y ? 1 : (this.scrollLastY > y ? -1 : 0);
    const emitEvent: boolean = this.emitEvent;
    const lastScrollAddedY: number = this.addingScrollY;
    const scrollableHeight: number = ParseInt(elm?.offsetHeight + maxY);
    // Скролл
    return {
      x,
      y,
      maxX,
      maxY,
      lastDirectionX,
      lastDirectionY,
      emitEvent,
      elm,
      lastScrollAddedY,
      scrollableHeight
    };
  }





  constructor() {
    WaitObservable(() => !ScrollElement())
      .pipe(
        takeUntil(this.destroyed$),
        tap(() => this.scrollElement = ScrollElement()),
        mergeMap(() => fromEvent(this.scrollElement, "scroll"), () => this.getCurrentScroll),
        switchMap(scrollData => scrollData.x !== this.scrollLastX || scrollData.y !== this.scrollLastY ? of(scrollData) : throwError(scrollData)),
      )
      .subscribe(
        scrollData => {
          const currentDate: number = (new Date()).getTime();
          // Неконтролируемое начало скролла
          if (this.scrollLastTime + this.scrollInterruptTime <= currentDate && this.emitEvent) {
            this.scrollAlwaysStartEvent$.next(scrollData);
          }
          // Неконтролируемое событие
          this.scrollAlwaysEvent$.next(scrollData);
          // Контролируемое событие
          if (this.emitEvent) {
            this.scrollEvent$.next(scrollData);
          }
          // Неконтролируемый конец скрола
          timer(this.scrollInterruptTime)
            .pipe(
              takeUntil(this.destroyed$),
              take(1),
              map(() => (new Date()).getTime()),
              switchMap(currentDate => this.scrollLastTime + this.scrollInterruptTime <= currentDate ? of(true) : throwError(false)),
              switchMap(() => this.emitEvent ? of(true) : throwError(true))
            )
            .subscribe(
              () => {
                if (this.emitEvent) {
                  this.scrollAlwaysEndEvent$.next(scrollData);
                }
                // Вернуть прослушивание событий
                this.restoreScrollEvents();
              },
              error => !!error ? this.restoreScrollEvents() : null
            );
          // Запонить предыдущие значения скролла
          this.scrollLastX = scrollData.x;
          this.scrollLastY = scrollData.y;
          this.scrollLastTime = currentDate;
        },
        () => this.restoreScrollEvents()
      );
    // Заблокировать прокрутку для пользователя
    merge(
      fromEvent<WheelEvent>(window, "mousewheel", { passive: false }),
      fromEvent<WheelEvent>(window, "DOMMouseScroll", { passive: false }),
      fromEvent<WheelEvent>(window, "wheel", { passive: false })
    )
      .pipe(
        takeUntil(this.destroyed$),
        filter(() => !this.emitEvent)
      )
      .subscribe(event => event.preventDefault());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Вызов событий
  private onScrollEvents({ x: left, y: top }: XYCoord): void {
    if (!!this.scrollElement) {
      const newScroll: ScrollData = this.getCurrentScroll;
      const emitEvent: boolean = this.emitEvent;
      // Событие перед скролом
      if (emitEvent) {
        this.scrollStartEvent$.next(newScroll);
      }
      // Изменить позицию
      this.scrollElement.scrollTo({ top, left, behavior: "auto" });
      // Событие после скролом
      if (emitEvent) {
        this.scrollEndEvent$.next(newScroll);
      }
    }
  }

  // Начало скролла
  onScrollStart(): Observable<ScrollData> {
    return this.scrollStartEvent$.asObservable().pipe(
      takeUntil(this.destroyed$),
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onScroll(): Observable<ScrollData> {
    return this.scrollEvent$.asObservable().pipe(
      takeUntil(this.destroyed$),
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Конец скролла
  onScrollEnd(): Observable<ScrollData> {
    return this.scrollEndEvent$.asObservable().pipe(
      takeUntil(this.destroyed$),
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onAlwaysStartScroll(): Observable<ScrollData> {
    return this.scrollAlwaysStartEvent$.asObservable().pipe(
      takeUntil(this.destroyed$),
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onAlwaysScroll(): Observable<ScrollData> {
    return this.scrollAlwaysEvent$.asObservable().pipe(
      takeUntil(this.destroyed$),
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onAlwaysEndScroll(): Observable<ScrollData> {
    return this.scrollAlwaysEndEvent$.asObservable().pipe(
      takeUntil(this.destroyed$),
      map(data => data ?? this.getCurrentScroll)
    );
  }





  // Скролл к определенной позиции
  scrollTo({ top, left, behavior, emitEvent }: SetScrollData): void {
    if (!!this.scrollElement) {
      const scrollData: ScrollData = this.getCurrentScroll;
      // Проверка параметров
      emitEvent = emitEvent === false ? false : true;
      top = top ?? scrollData.y;
      left = left ?? scrollData.x;
      behavior = behavior ?? "auto";
      // Если скролл отличается от текущего
      if (scrollData.y !== top) {
        this.emitEvent = emitEvent;
        // Резкий скролл
        if (behavior === "auto") {
          this.onScrollEvents({ y: top, x: left });
        }
        // Плавный скролл
        else {
          const scrollEventId: string = CreateRandomID(128);
          const xyCoordKeys: (keyof XYCoord)[] = ["x", "y"];
          const newScroll: XYCoord = { x: left, y: top };
          let startScroll: Partial<XYCoord> = { ...scrollData };
          let scrollDiff: Partial<XYCoord> = {};
          let scrollSteps: Partial<XYCoord> = {};
          let scrollDelta: Partial<XYCoord<NumberDirection>> = {};
          let stepShifts: Partial<XYCoord> = {};
          let maxStep: number = 0;
          // Запонить данные
          xyCoordKeys.forEach(key => {
            const diff: number = newScroll[key] - startScroll[key];
            // Установить параметры
            scrollDiff[key] = Math.abs(diff);
            stepShifts[key] = this.scrollStepShift;
            scrollSteps[key] = Math.ceil(scrollDiff[key] / stepShifts[key]);
            scrollDelta[key] = diff > 0 ? 1 : (diff < 0 ? -1 : 0);
          });
          // ID прокрутки
          this.scrollEventLastId = scrollEventId;
          // Время анимации превышает максимально допустимое
          xyCoordKeys
            .filter(key => scrollSteps[key] * this.scrollSpeedByStep > this.scrollMaxTime)
            .forEach(key => {
              scrollSteps[key] = Math.ceil(this.scrollMaxTime / this.scrollSpeedByStep);
              stepShifts[key] = Math.ceil(scrollDiff[key] / scrollSteps[key]);
            });
          // Максимальное число шагов
          maxStep = Math.max(...Object.values(scrollSteps));
          // Событие начала скролла
          if (emitEvent) {
            this.scrollStartEvent$.next(scrollData);
          }
          // Скролл
          timer(0, this.scrollSpeedByStep)
            .pipe(
              takeUntil(this.destroyed$),
              takeWhile(() => this.scrollEventLastId === scrollEventId),
              take(maxStep),
              map(i => i + 1),
              map(i => ({ step: i, stepX: CheckInRange(i, scrollSteps.x), stepY: CheckInRange(i, scrollSteps.y) }))
            )
            .subscribe(({ step, stepX, stepY }) => {
              const shiftX: number = CheckInRange(stepShifts.x * stepX, scrollDiff.x) * scrollDelta.x;
              const shiftY: number = CheckInRange(stepShifts.y * stepY, scrollDiff.y) * scrollDelta.y;
              const top: number = scrollData.y + shiftY;
              const left: number = scrollData.x + shiftX;
              // Скролл
              this.scrollElement.scrollTo({ top, left, behavior: "auto" });
              // Конец скролла
              if (step === maxStep && emitEvent) {
                this.scrollEndEvent$.next(this.getCurrentScroll);
              }
            });
        }
      }
      // Окончание скролла
      else {
        this.onScrollEvents({ y: top, x: left });
      }
    }
  }

  // Скролл к определенной позиции по Y
  scrollToY(top: number, behavior: ScrollBehavior = "auto", emitEvent: boolean = true): void {
    const { x: left }: ScrollData = this.getCurrentScroll;
    // Вызов события
    this.scrollTo({ top, left, behavior, emitEvent });
  }

  // Сохранить скролл в текущей позиции
  saveScroll(): Observable<ScrollData> {
    let startScrollData: ScrollData = this.getCurrentScroll;
    let scrollLastTime: number = (new Date()).getTime();
    // Вернуть подписчик
    return WaitObservable(() => !this.getCurrentScroll?.elm).pipe(
      takeUntil(this.destroyed$),
      mergeMap(() => merge(timer(0, this.scrollSpeedByStep), this.onAlwaysScroll()).pipe(
        filter(() => startScrollData.scrollableHeight !== this.getCurrentScroll.scrollableHeight)
      )),
      timeout(this.saveScrollInterruptTime),
      map(() => (new Date()).getTime()),
      takeWhile(currentDate => scrollLastTime + this.saveScrollInterruptTime > currentDate),
      map(currentDate => ({ currentDate, scrollData: this.getCurrentScroll })),
      map(({ currentDate, scrollData }) => {
        const pageDiff: number = scrollData.scrollableHeight - startScrollData.scrollableHeight;
        const top: number = scrollData.y + pageDiff;
        // Метка о добавлении
        this.addingScrollY = pageDiff;
        // Перенести на новое место
        this.scrollToY(top, "auto", false);
        // Запомнить значения
        scrollLastTime = currentDate;
        startScrollData = scrollData;
        // Вернуть данные
        return this.getCurrentScroll;
      })
    );
  }

  // Сбросить ограничения на скролл
  private restoreScrollEvents(): void {
    this.emitEvent = true;
    this.addingScrollY = 0;
  }
}
