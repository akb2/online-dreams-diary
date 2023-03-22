import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from "@angular/router";
import { CustomObject, RouteData } from "@_models/app";
import { AccountService } from "@_services/account.service";
import { GlobalService } from "@_services/global.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class AppComponent implements OnInit, OnDestroy {


  showPreLoader: boolean = true;

  private pageData: RouteData;

  statusBarColor: string = "#3f52b5";

  private destroy$: Subject<void> = new Subject();





  // Дополнительные данные страницы
  private get getExtraDatas(): ExtraDatas {
    const extraDatas: CustomObject<any> = this.router.getCurrentNavigation()?.extras.state ?? {};
    // Найти данные
    return Object.entries(DefaultExtraDatas)
      .map(([k, v]) => ([k, extraDatas.hasOwnProperty(k) ? !!extraDatas[k] : v]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: !!v }), {} as ExtraDatas);
  }





  constructor(
    private router: Router,
    private globalService: GlobalService,
    private titleService: Title,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService
  ) { }

  ngOnInit() {
    // События старта и окочания лоадера
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.beforeLoadPage();
        }
        // Конец роута
        else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.pageData = this.globalService.getPageData;
          // Функция обработчик
          this.afterLoadPage(event);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Действия перед загрузкой страницы
  private beforeLoadPage(): void {
    const { showPreLoader }: ExtraDatas = this.getExtraDatas;
    // Запуск прелоадера
    if (showPreLoader) {
      this.showPreLoader = true;
      this.changeDetectorRef.detectChanges();
      document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    }
  }

  // Действия после загрузки страницы
  private afterLoadPage(event: NavigationEnd | NavigationCancel | NavigationError): void {
    const { changeTitle }: ExtraDatas = this.getExtraDatas;
    // Сменить название страницы
    if (changeTitle) {
      this.titleService.setTitle(this.globalService.createTitle(this.pageData?.title));
    }
    // Отключение прелоадера
    this.showPreLoader = false;
    this.changeDetectorRef.detectChanges();
    document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    // Обновить для анонимного пользователя
    if (!this.globalService.user && event instanceof NavigationEnd) {
      this.accountService.syncAnonymousUser().subscribe();
    }
  }
}





// Интерфейс дополнительных данных страницы
export interface ExtraDatas {
  checkToken: boolean;
  showPreLoader: boolean;
  changeTitle: boolean;
}

// Дополнительные данные страницы по умолчанию
export const DefaultExtraDatas: ExtraDatas = {
  checkToken: true,
  showPreLoader: true,
  changeTitle: true
};
