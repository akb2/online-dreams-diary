import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { Dream, DreamMode } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { DreamService, DreamTitle } from "@_services/dream.service";
import { Subject } from "rxjs";





@Component({
  selector: "app-diary-viewer",
  templateUrl: "./diary-viewer.component.html",
  styleUrls: ["./diary-viewer.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DiaryViewerComponent implements OnInit, DoCheck, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;

  defaultTitle: string = DreamTitle;
  today: Date = new Date();

  _navMenuType: typeof NavMenuType = NavMenuType;

  dreamId: number = 0;
  private fromMark: string;
  dream: Dream;

  oldUser: User;

  private destroy$: Subject<void> = new Subject<void>();





  // Текущий пользователя
  get user(): User {
    return AppComponent.user;
  };

  // Кнопка назад
  get backLink(): string {
    const fromArray: string[] = this.fromMark.split("|") || [];
    const from: string = fromArray[fromArray.length - 1] || "";
    // Список всех сновидений
    if (from === "diary-all") {
      return "/diary/all";
    }
    // Мой дневник
    return "/diary/" + this.dream.user.id;
  }

  // Кнопка назад: параметры
  get backLinkParams(): SimpleObject {
    const fromArray: string[] = this.fromMark.split("|") || [];
    const fromMark: string = fromArray.filter((v, k) => k < fromArray.length - 1).join("|");
    // Вернуть значение
    return fromMark ? { from: fromMark } : {};
  }

  // Плавающая кнопка
  get floatButtonData(): FloatButtonData {
    const data: FloatButtonData = {
      icon: "person",
      link: "/profile/" + this.dream.user.id,
      params: {}
    };
    // Редакировать
    if (this.user?.id === this.dream.user.id) {
      data.icon = "edit";
      data.link = "/diary/editor/" + this.dream.id;
      data.params.from = this.fromMark + (this.fromMark.length > 0 ? "|" : "") + "diary-viewer";
    }
    // Вернуть данные
    return data;
  }

  // Доступен ли просмотр текста
  get isTextAvail(): boolean {
    return (this.dream.mode === DreamMode.mixed || this.dream.mode === DreamMode.text) && this.dream.text.length > 0;
  }

  // Доступен ли просмотр текста
  get isMapAvail(): boolean {
    return (this.dream.mode === DreamMode.mixed || this.dream.mode === DreamMode.map) && !!this.dream.map;
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private router: Router,
    private domSanitizer: DomSanitizer
  ) {
    this.dreamId = parseInt(this.activatedRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
  }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // Метка источника перехода
      this.fromMark = params.from?.toString() || "";
      // Загрузка данных
      this.defineData();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Определить данные
  private defineData(): void {
    // Редактирование сновидения
    if (this.dreamId > 0) {
      this.dreamService.getById(this.dreamId, false).subscribe(
        dream => {
          this.dream = dream;
          // Отметить готовность
          this.ready = true;
          // Обновить
          this.changeDetectorRef.detectChanges();
        },
        () => this.router.navigate(["404"])
      );
    }
    // Новое сновидение
    else {
      this.dream = this.dreamService.newDream;
      // Отметить готовность
      this.ready = true;
      // Обновить
      this.changeDetectorRef.detectChanges();
    }
  }
}





// Данные плавающей кнопки
interface FloatButtonData {
  icon: string;
  link: string;
  params?: SimpleObject;
}
