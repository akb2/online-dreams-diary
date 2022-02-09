import { ChangeDetectorRef, Component, DoCheck, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AppComponent } from "@app/app.component";
import { CKEditor5 } from "@ckeditor/ckeditor5-angular";
import * as ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import "@ckeditor/ckeditor5-build-classic/build/translations/ru";
import { OptionData } from "@_controlers/autocomplete-input/autocomplete-input.component";
import { DreamMapEditorComponent } from "@_controlers/dream-map-editor/dream-map-editor.component";
import { NavMenuSettingData } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { User } from "@_models/account";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamMode, DreamModes, DreamStatus, DreamStatuses } from "@_models/dream";
import { DreamErrorMessages, DreamValidatorData, ErrorMessagesType, FormData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { DreamService } from "@_services/dream.service";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";





@Component({
  selector: "app-diary-editor",
  templateUrl: "./diary-editor.component.html",
  styleUrls: ["./diary-editor.component.scss"]
})

export class DiaryEditorComponent implements DoCheck, OnInit, OnDestroy {


  @ViewChild(NavMenuComponent) mainMenu!: NavMenuComponent;
  @ViewChild(DreamMapEditorComponent) mapEditor!: DreamMapEditorComponent;

  editor: any = ClassicEditor;
  config: CKEditor5.Config = { language: "ru" };
  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;

  defaultTitle: string = "*** Новое сновидение ***";
  today: Date = new Date();

  _navMenuType: typeof NavMenuType = NavMenuType;
  _dreamMode: typeof DreamMode = DreamMode;

  dreamForm: FormGroup;
  dreamId: number = 0;
  dream: Dream;
  errors: ErrorMessagesType = DreamErrorMessages;

  oldUser: User;
  public get user(): User {
    return AppComponent.user;
  };

  titleMinLength: number = FormData.dreamTitleMinLength;
  titleMaxLength: number = FormData.dreamTitleMaxLength;
  descriptionMaxLength: number = FormData.dreamDescriptionMaxLength;
  keywordsMaxLength: number = 500;
  dateMin: Date = new Date();
  dateMax: Date = new Date();
  dreamModes: OptionData[] = DreamModes;
  dreamStatuses: OptionData[] = DreamStatuses;

  private destroy$: Subject<void> = new Subject<void>();
  private changes$: Subject<void> = new Subject<void>();





  constructor(
    private activateRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.dreamId = parseInt(this.activateRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
    // Форма сновидений
    this.dreamForm = this.formBuilder.group({
      title: ["", DreamValidatorData.title],
      description: [""],
      mode: [DreamMode.text],
      status: [DreamStatus.draft],
      date: [new Date()],
      keywords: [[]],
      text: [""]
    });
    // Изменения формы
    this.dreamForm.get("title").valueChanges.pipe(takeUntil(this.changes$)).subscribe(value => this.onChangeTitle(value || ""));
    this.dreamForm.get("date").valueChanges.pipe(takeUntil(this.changes$)).subscribe(value => this.onChangeDate(value || new Date()));
  }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      // Проверка пользователя
      if (this.user) {
        this.dateMin = new Date(this.user.birthDate);
      }
      // Обновить
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
    if (this.dreamForm.invalid) {
      this.dreamForm.markAllAsTouched();
    }
    // Сохранить
    if (this.dream.id === 0 || (this.dream.id > 0 && this.dreamForm.valid)) {
      const status: DreamStatus = this.dreamForm.invalid ? DreamStatus.draft : this.dreamForm.get("status").value as DreamStatus;
      // Данные
      this.dream.description = this.dreamForm.get("description").value as string;
      this.dream.mode = this.dreamForm.get("mode").value as DreamMode;
      this.dream.status = status;
      this.dream.keywords = this.dreamForm.get("keywords").value as string[];
      this.dream.text = this.dreamForm.get("text").value as string;
      this.dream.map = this.mapEditor.getMap;
      // Сохранение
      this.dreamService.saveDream(this.dream).subscribe(
        r => console.log(r),
        e => console.log(e)
      );
    }
  }

  // Изменение типа сновидения
  onChangeMode(): void {
    const defaultMode: DreamMode = DreamMode.text;
    const mode: DreamMode = parseInt(this.dreamForm.get("mode").value) as DreamMode || defaultMode;
    // Новый метод
    this.dream.mode = mode;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение названия сновидения
  private onChangeTitle(title: string): void {
    this.dream.title = title;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение названия сновидения
  private onChangeDate(date: Date): void {
    this.dream.date = date;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменить настройки оформления
  onChangeSettings(settings: NavMenuSettingData): void {
    this.dream.headerBackground = BackgroundImageDatas.find(b => b.id === settings.backgroundId);
    this.dream.headerType = settings.navMenuType;
    // Скролл в начало
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Переключение вкладки
  onChangeTab(index: number): void {
    this.mainMenu.collapseMenu()
  }





  // Определить данные
  private defineData(): void {
    // Редактирование сновидения
    if (this.dreamId > 0) {
      this.dreamService.getDream(this.dreamId).subscribe(
        dream => {
          this.dream = dream;
          // Создать форму
          this.createForm();
        },
        () => this.router.navigate(["404"])
      );
    }
    // Новое сновидение
    else {
      this.dream = this.dreamService.newDream();
      // Создать форму
      this.createForm();
    }
  }

  // Года в дату
  ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }

  // Создать форму
  private createForm(): void {
    this.dreamForm.get("title").setValue(this.dream.title);
    this.dreamForm.get("description").setValue(this.dream.description);
    this.dreamForm.get("mode").setValue(this.dream.mode.toString());
    this.dreamForm.get("status").setValue(this.dream.status.toString());
    this.dreamForm.get("date").setValue(this.dream.date);
    this.dreamForm.get("keywords").setValue(this.dream.keywords);
    this.dreamForm.get("text").setValue(this.dream.text);
    // Отметить готовность
    this.ready = true;
  }
}
