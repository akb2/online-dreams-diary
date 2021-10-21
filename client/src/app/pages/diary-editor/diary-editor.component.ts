import { ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { AppComponent } from "@app/app.component";
import * as ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { NavMenuSettingData } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { DreamService } from "@_services/dream.service";
import { of, Subject } from "rxjs";
import { delay } from "rxjs/operators";





@Component({
  selector: "app-diary-editor",
  templateUrl: "./diary-editor.component.html",
  styleUrls: ["./diary-editor.component.scss"]
})

export class DiaryEditorComponent implements DoCheck, OnInit, OnDestroy {


  editor: any = ClassicEditor;
  config: SimpleObject = { language: "ru" };
  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;

  title: string = "Редактор сновидения";
  subTitle: string = "Новое сновидение";
  _navMenuType: typeof NavMenuType = NavMenuType;

  dreamForm: FormGroup;
  dreamId: number = 0;
  dream: Dream;

  private destroy$: Subject<void> = new Subject<void>();

  oldUser: User;
  public get user(): User {
    return AppComponent.user;
  };





  constructor(
    private activateRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private formBuilder: FormBuilder
  ) {
    this.dreamId = parseInt(this.activateRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
  }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnInit() {
    this.defineData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Сохранение
  onSave(): void {
    this.dream.keywords = this.dreamForm.get("keywords").value;
    this.dream.text = this.dreamForm.get("text").value;
    // Сохранить
    console.log(this.dream);
  }

  // Изменить настройки оформления
  onChangeSettings(settings: NavMenuSettingData): void {
    this.dream.headerBackground = BackgroundImageDatas.find(b => b.id === settings.backgroundId);
    this.dream.headerType = settings.navMenuType;
    // Скролл в начало
    window.scrollTo({ top: 0, behavior: "smooth" });
  }





  // Определить данные
  private defineData(): void {
    // Редактирование сновидения
    if (this.dreamId > 0) {
      of(this.dreamService.newDream()).pipe(delay(3000)).subscribe(dream => {
        this.title = "Редактор сновидения";
        this.subTitle = "*** Название сновидения ***";
        this.dream = dream;
        // Создать форму
        this.createFrom();
      });
    }
    // Новое сновидение
    else {
      this.dream = this.dreamService.newDream();
      // Создать форму
      this.createFrom();
    }
  }

  // Создать форму
  private createFrom(): void {
    this.dreamForm = this.formBuilder.group({
      keywords: [this.dream.keywords],
      text: [this.dream.text]
    });
    // Отметить готовность
    this.ready = true;
  }
}
