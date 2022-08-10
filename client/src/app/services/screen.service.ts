import { Injectable, OnDestroy } from "@angular/core";
import { LoadingImageData, ScreenBreakpoints, ScreenKeys } from "@_models/screen";
import { BehaviorSubject, fromEvent, Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Injectable({
  providedIn: "root"
})

export class ScreenService implements OnDestroy {


  private breakpoints: ScreenBreakpoints = {
    default: 0,
    xsmall: 600,
    small: 900,
    middle: 1200,
    large: 1800,
    xlarge: 10000
  };

  private mobileBreakpoints: ScreenKeys[] = ["xsmall", "small"];

  private destroy$: Subject<void> = new Subject<void>();
  private isMobile: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  readonly isMobile$: Observable<boolean> = this.isMobile.asObservable();





  constructor() {
    this.updateIsMobile();
    // Обновить метку о типе интерфейса
    fromEvent(window, "resize", () => this.updateIsMobile()).pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.isMobile.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Определить брейкпоинт
  getBreakpoint(resolution: number = window.innerWidth): ScreenKeys {
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
  loadImage(url: string): Observable<LoadingImageData> {
    const observable: Observable<LoadingImageData> = new Observable(observer => {
      const image: HTMLImageElement = new Image();
      // Путь к картинке
      image.src = url;
      // Загрузка
      image.onload = () => {
        observer.next(new LoadingImageData(url, image.width, image.height));
        observer.complete();
      };
      // Ошибка
      image.onerror = error => observer.error(error);
    });
    // Вернуть подписчик
    return observable.pipe(takeUntil(this.destroy$));
  }





  // Обновить мобильный интерфейс
  private updateIsMobile(): void {
    const oldValue: boolean = this.isMobile.getValue();
    const newValue: boolean = this.mobileBreakpoints.includes(this.getBreakpoint());
    // Если брейкпоинт изменился
    if (oldValue !== newValue) {
      this.isMobile.next(newValue);
    }
  }
}
