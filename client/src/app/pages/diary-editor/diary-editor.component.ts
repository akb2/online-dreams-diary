import { ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { NavMenuSettingData } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { User } from "@_models/account";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";
import { of, Subject } from "rxjs";
import { delay } from "rxjs/operators";





@Component({
  selector: "app-diary-editor",
  templateUrl: "./diary-editor.component.html",
  styleUrls: ["./diary-editor.component.scss"]
})

export class DiaryEditorComponent implements DoCheck, OnInit, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;

  title: string = "Редактор сновидения";
  subTitle: string = "Новое сновидение";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 11);
  navMenuType: NavMenuType = NavMenuType.short;
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";

  dreamId: number = 0;

  private destroy$: Subject<void> = new Subject<void>();

  oldUser: User;
  public get user(): User {
    return AppComponent.user;
  };





  constructor(
    private activateRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.dreamId = parseInt(this.activateRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
  }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
      // Определить тему
      this.backgroundImageData = this.user.settings.profileBackground;
    }
  }

  ngOnInit() {
    this.defineData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Определить данные
  private defineData(): void {
    // Редактирование сновидения
    if (this.dreamId > 0) {
      of(true).pipe(delay(3000)).subscribe(() => {
        this.title = "Редактор сновидения";
        this.subTitle = "*** Название сновидения ***";
        // Отметить готовность
        this.ready = true;
      });
    }
    // Новое сновидение
    else {
      this.ready = true;
    }
  }

  // Изменить настройки оформления
  changeSettings(settings: NavMenuSettingData): void {
  }
}
