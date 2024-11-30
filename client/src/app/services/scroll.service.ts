import { ScrollElement } from "@_datas/app";
import { CheckInRange, DetectDirectionByExpressions, ParseFloat, ParseInt } from "@_helpers/math";
import { WaitObservable } from "@_helpers/rxjs";
import { CreateRandomID } from "@_helpers/string";
import { XYCoord } from "@_models/dream-map";
import { NumberDirection } from "@_models/math";
import { ScrollData, SetScrollData } from "@_models/screen";
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, animationFrameScheduler, distinctUntilChanged, filter, first, fromEvent, map, merge, observeOn, of, retry, switchMap, take, takeUntil, takeWhile, tap, throwError, timeout, timer } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class ScrollService implements OnDestroy {

  private scrollElement: HTMLElement;

  private emitEvent = true;
  private readonly scrollSpeedByStep = 25;
  private readonly scrollMaxTime = 350;
  private readonly scrollStepShift = 50;
  private readonly scrollInterruptTime = 50;
  private readonly saveScrollInterruptTime = 1500;

  private scrollEventLastId: string;
  private scrollLastX: number;
  private scrollLastY: number;
  private scrollLastTime = 0;
  private addingScrollY = 0;

  private scrollStartEvent$ = new BehaviorSubject<ScrollData>(null);
  private scrollEvent$ = new BehaviorSubject<ScrollData>(null);
  private scrollEndEvent$ = new BehaviorSubject<ScrollData>(null);
  private scrollAlwaysStartEvent$ = new BehaviorSubject<ScrollData>(null);
  private scrollAlwaysEvent$ = new BehaviorSubject<ScrollData>(null);
  private scrollAlwaysEndEvent$ = new BehaviorSubject<ScrollData>(null);
  private destroyed$ = new Subject<void>();





  // Текущий скролл
  get getCurrentScroll(): ScrollData {
    const elm = this.scrollElement;
    const x = Math.ceil(ParseFloat(elm?.scrollLeft, 0, 10));
    const y = Math.ceil(ParseFloat(elm?.scrollTop, 0, 10));
    const maxX = ParseInt(elm?.scrollWidth) - ParseInt(elm?.clientWidth);
    const maxY = ParseInt(elm?.scrollHeight) - ParseInt(elm?.clientHeight);
    const lastDirectionX = DetectDirectionByExpressions(this.scrollLastX < x, this.scrollLastX > x);
    const lastDirectionY = DetectDirectionByExpressions(this.scrollLastY < y, this.scrollLastY > y);
    const emitEvent = this.emitEvent;
    const lastScrollAddedY = this.addingScrollY;
    const scrollableHeight = ParseInt(elm?.offsetHeight + maxY);
    // Скролл
    return { x, y, maxX, maxY, lastDirectionX, lastDirectionY, emitEvent, elm, lastScrollAddedY, scrollableHeight };
  }





  constructor() {
    this.scrollListener();
    this.blockScrollListener();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Вызов событий
  private onScrollEvents({ x: left, y: top }: XYCoord): void {
    if (!!this.scrollElement) {
      const newScroll: ScrollData = this.getCurrentScroll;
      const emitEvent = this.emitEvent;
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
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onScroll(): Observable<ScrollData> {
    return this.scrollEvent$.asObservable().pipe(
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Конец скролла
  onScrollEnd(): Observable<ScrollData> {
    return this.scrollEndEvent$.asObservable().pipe(
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onAlwaysStartScroll(): Observable<ScrollData> {
    return this.scrollAlwaysStartEvent$.asObservable().pipe(
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onAlwaysScroll(): Observable<ScrollData> {
    return this.scrollAlwaysEvent$.asObservable().pipe(
      map(data => data ?? this.getCurrentScroll)
    );
  }

  // Прослушивание скролла
  onAlwaysEndScroll(): Observable<ScrollData> {
    return this.scrollAlwaysEndEvent$.asObservable().pipe(
      map(data => data ?? this.getCurrentScroll)
    );
  }





  // Скролл к определенной позиции
  scrollTo({ top, left, behavior, emitEvent }: SetScrollData): void {
    if (!!this.scrollElement) {
      const scrollData: ScrollData = this.getCurrentScroll;
      // Проверка параметров
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
          const scrollEventId = CreateRandomID(128);
          const xyCoordKeys: (keyof XYCoord)[] = ["x", "y"];
          const newScroll: XYCoord = { x: left, y: top };
          let startScroll: Partial<XYCoord> = { ...scrollData };
          let scrollDiff: Partial<XYCoord> = {};
          let scrollSteps: Partial<XYCoord> = {};
          let scrollDelta: Partial<XYCoord<NumberDirection>> = {};
          let stepShifts: Partial<XYCoord> = {};
          let maxStep = 0;
          // Запонить данные
          xyCoordKeys.forEach(key => {
            const diff = newScroll[key] - startScroll[key];
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
              takeWhile(() => this.scrollEventLastId === scrollEventId),
              take(maxStep),
              map(i => i + 1),
              map(i => ({ step: i, stepX: CheckInRange(i, scrollSteps.x), stepY: CheckInRange(i, scrollSteps.y) })),
              takeUntil(this.destroyed$)
            )
            .subscribe(
              ({ step, stepX, stepY }) => {
                const shiftX = CheckInRange(stepShifts.x * stepX, scrollDiff.x) * scrollDelta.x;
                const shiftY = CheckInRange(stepShifts.y * stepY, scrollDiff.y) * scrollDelta.y;
                const top = scrollData.y + shiftY;
                const left = scrollData.x + shiftX;
                // Скролл
                this.scrollElement.scrollTo({ top, left, behavior: "auto" });
                // Конец скролла
                if (step === maxStep && emitEvent) {
                  if (this.emitEvent) {
                    this.scrollEndEvent$.next(this.getCurrentScroll);
                  }
                  // Восстановить события скролла
                  this.restoreScrollEvents();
                }
              },
              event => {
                if (this.emitEvent) {
                  this.scrollEndEvent$.next(this.getCurrentScroll);
                }
                // Восстановить события скролла
                this.restoreScrollEvents(event);
              }
            );
        }
      }
      // Окончание скролла
      else {
        this.onScrollEvents({ y: top, x: left });
      }
    }
  }

  // Скролл к определенной позиции по Y
  scrollToY(top: number, behavior: ScrollBehavior = "auto", emitEvent = true): void {
    const { x: left }: ScrollData = this.getCurrentScroll;
    // Вызов события
    this.scrollTo({ top, left, behavior, emitEvent });
  }

  // Сместить скролл
  scrollBy({ top, left, behavior, emitEvent }: SetScrollData) {
    top += this.getCurrentScroll.y;
    left += this.getCurrentScroll.x;
    // Вызов события
    this.scrollTo({ top, left, behavior, emitEvent });
  }

  // Сохранить скролл в текущей позиции
  saveScroll(): Observable<ScrollData> {
    let startScrollData: ScrollData = this.getCurrentScroll;
    let scrollLastTime = (new Date()).getTime();
    // Вернуть подписчик
    return WaitObservable(() => !this.getCurrentScroll?.elm).pipe(
      switchMap(() => merge(timer(0, this.scrollSpeedByStep), this.onAlwaysScroll()).pipe(
        filter(() => startScrollData.scrollableHeight !== this.getCurrentScroll.scrollableHeight)
      )),
      timeout(this.saveScrollInterruptTime),
      map(() => (new Date()).getTime()),
      takeWhile(currentDate => scrollLastTime + this.saveScrollInterruptTime > currentDate),
      map(currentDate => ({ currentDate, scrollData: this.getCurrentScroll })),
      map(({ currentDate, scrollData }) => {
        const pageDiff = scrollData.scrollableHeight - startScrollData.scrollableHeight;
        const top = scrollData.y + pageDiff;
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
  private restoreScrollEvents(event?: any): void {
    this.emitEvent = true;
    this.addingScrollY = 0;
    // Вывод ошибки
    if (!!event && event !== true) {
      console.error(event);
    }
  }





  // Прослушивание скролла
  private scrollListener() {
    WaitObservable(() => !ScrollElement())
      .pipe(
        tap(() => this.scrollElement = ScrollElement()),
        switchMap(() => fromEvent(this.scrollElement, "scroll").pipe(
          observeOn(animationFrameScheduler),
          map(() => this.getCurrentScroll),
          distinctUntilChanged((prev, next) => prev.y === next.y && prev.maxY === next.maxY),
          switchMap(scrollData => scrollData.x !== this.scrollLastX || scrollData.y !== this.scrollLastY
            ? of(scrollData)
            : throwError(scrollData)
          ),
          retry()
        )),
        takeUntil(this.destroyed$)
      )
      .subscribe(
        scrollData => {
          const currentDate = (new Date()).getTime();
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
              first(),
              map(() => (new Date()).getTime()),
              switchMap(currentDate => this.scrollLastTime + this.scrollInterruptTime <= currentDate
                ? of(true)
                : throwError(false)
              ),
              switchMap(() => this.emitEvent
                ? of(true)
                : throwError(true)
              ),
              takeUntil(this.destroyed$)
            )
            .subscribe(
              () => {
                if (this.emitEvent) {
                  this.scrollAlwaysEndEvent$.next(scrollData);
                }
                // Вернуть прослушивание событий
                this.restoreScrollEvents();
              },
              error => !!error
                ? this.restoreScrollEvents(error)
                : null
            );
          // Запонить предыдущие значения скролла
          this.scrollLastX = scrollData.x;
          this.scrollLastY = scrollData.y;
          this.scrollLastTime = currentDate;
        },
        event => this.restoreScrollEvents(event)
      );
  }

  // Заблокировать прокрутку для пользователя
  private blockScrollListener() {
    merge(
      fromEvent<WheelEvent>(window, "mousewheel", { passive: false }),
      fromEvent<WheelEvent>(window, "DOMMouseScroll", { passive: false }),
      fromEvent<WheelEvent>(window, "wheel", { passive: false })
    )
      .pipe(
        map(event => ({ event, scroll: this.getCurrentScroll })),
        filter(({ scroll }) => !this.emitEvent || scroll.y < 0 || scroll.y > scroll.maxY),
        takeUntil(this.destroyed$)
      )
      .subscribe(({ event, scroll }) => {
        event.preventDefault();
        // Поправить скролл
        if (scroll.y < 0 || scroll.y > scroll.maxY) {
          this.scrollTo({
            top: Math.min(Math.max(scroll.y, 0), scroll.maxY),
            behavior: "auto",
            emitEvent: false
          })
        }
      });
  }
}
