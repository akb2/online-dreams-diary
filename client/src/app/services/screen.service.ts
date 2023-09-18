import { ElmSize, LoadingImageData, ScreenBreakpoints, ScreenKeys } from "@_models/screen";
import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, Subject, Subscriber, fromEvent, timer } from "rxjs";
import { filter, map, pairwise, skipWhile, startWith, takeUntil, takeWhile } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class ScreenService implements OnDestroy {


  private breakpoints: ScreenBreakpoints = {
    default: 0,
    xxsmall: 400,
    xsmall: 600,
    small: 900,
    middle: 1200,
    large: 1800,
    xlarge: 10000
  };

  private mobileBreakpoints: ScreenKeys[] = ["xxsmall", "xsmall", "small"];

  private isMobile: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly isMobile$: Observable<boolean>;

  private breakpoint: BehaviorSubject<ScreenKeys> = new BehaviorSubject<ScreenKeys>("default");
  readonly breakpoint$: Observable<ScreenKeys>;

  private destroy$: Subject<void> = new Subject<void>();





  constructor() {
    this.updateIsMobile();
    // Обновить метку о типе интерфейса
    fromEvent(window, "resize").pipe(takeUntil(this.destroy$)).subscribe(() => this.updateIsMobile());
    // Подписки
    this.isMobile$ = this.isMobile.asObservable().pipe(
      takeUntil(this.destroy$),
      startWith(undefined),
      pairwise(),
      filter(([prev, next]) => prev !== next),
      map(([, next]) => next)
    );
    this.breakpoint$ = this.breakpoint.asObservable().pipe(
      takeUntil(this.destroy$),
      startWith(undefined),
      pairwise(),
      filter(([prev, next]) => prev !== next),
      map(([, next]) => next)
    );
  }

  ngOnDestroy(): void {
    this.isMobile.complete();
    this.breakpoint.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Определить брейкпоинт
  getBreakpoint(resolution: number = -1): ScreenKeys {
    resolution = resolution >= 0 ? resolution : window.innerWidth;
    let breakpoint: ScreenKeys = "default";
    // Цикл по брейкпоинтам
    for (let key in this.breakpoints) {
      breakpoint = this.getMin(key) <= resolution && resolution <= this.getMax(key) ? key as ScreenKeys : breakpoint;
    }
    // Вернуть имя брейкпоинта
    return breakpoint;
  }

  // Минимальное разрешение
  getMin(screen: string): number {
    let result = this.breakpoints.default;
    let test = this.getMax(screen);

    for (let key in this.breakpoints) {
      let resolution: number = this.breakpoints[key];
      result = result < resolution && test > resolution ? resolution : result;
    }

    return result + 1;
  }

  // Максимальное разрешение
  getMax(screen: string): number {
    return this.breakpoints[screen] ? this.breakpoints[screen] : this.breakpoints.default;
  }

  // Подписчик на загрузку картинки
  loadImage(url: string | Blob): Observable<LoadingImageData> {
    const stringUrl: string = typeof url === "string" ? url : URL.createObjectURL(url);
    // Подписчик
    const observable: Observable<LoadingImageData> = new Observable(observer => {
      const image: HTMLImageElement = new Image();
      // Путь к картинке
      image.src = stringUrl;
      // Загрузка
      image.onload = () => {
        observer.next(new LoadingImageData(image, stringUrl, image.width, image.height));
        observer.complete();
      };
      // Ошибка
      image.onerror = error => observer.error(error);
    });
    // Вернуть подписчик
    return observable.pipe(takeUntil(this.destroy$));
  }

  // Изменение размеров HTML элемента
  elmResize(elm: HTMLElement | HTMLElement[]): Observable<ElmSize[]> {
    const elms: HTMLElement[] = Array.isArray(elm) ? elm : [elm];
    const observable: Observable<ElmSize[]> = new Observable((subscriber: Subscriber<ElmSize[]>) => {
      const resizeObserver = new ResizeObserver(entries => requestAnimationFrame(() => subscriber.next(entries.map(e => e.target as HTMLElement).map(element => ({
        element,
        width: element.offsetWidth,
        height: element.offsetHeight
      })))));
      elms.forEach(e => resizeObserver.observe(e));
      return () => resizeObserver.disconnect();
    });
    // Вернуть подписчик
    return observable.pipe(takeUntil(this.destroy$));
  }

  // Ожидание значения
  waitWhileFalse<T>(data: T): Observable<T> {
    return timer(0, 100).pipe(
      takeUntil(this.destroy$),
      takeWhile(() => !data, true),
      skipWhile(() => !data),
      map(() => data)
    );
  }





  // Обновить мобильный интерфейс
  private updateIsMobile(): void {
    const oldBreakpoint: ScreenKeys = this.breakpoint.getValue();
    const newBreakpoint: ScreenKeys = this.getBreakpoint();
    // Если брейкпоинт изменился
    if (oldBreakpoint !== newBreakpoint) {
      const oldIsMobile: boolean = this.isMobile.getValue();
      const newIsMobile: boolean = this.mobileBreakpoints.includes(newBreakpoint);
      // Обновить брейкпоинт
      this.breakpoint.next(newBreakpoint);
      // Если тип устройства сменился
      if (oldIsMobile !== newIsMobile) {
        this.isMobile.next(newIsMobile);
      }
    }
  }
}
