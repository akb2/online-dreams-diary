import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { User } from "@_models/account";
import { Dream } from "@_models/dream";
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
    if (this.fromMark === "diary-all") {
      return "/diary/all";
    }
    // Мой дневник
    return "/diary/" + this.dream.user.id;
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private router: Router
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
