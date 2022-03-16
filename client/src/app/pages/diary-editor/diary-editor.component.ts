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
import { SimpleObject } from "@_models/app";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamMode, DreamModes, DreamStatus, DreamStatuses } from "@_models/dream";
import { DreamErrorMessages, DreamValidatorData, ErrorMessagesType, FormData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { DreamService, DreamTitle } from "@_services/dream.service";
import { SnackbarService } from "@_services/snackbar.service";
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

  navMenuType: NavMenuType = NavMenuType.collapse;
  defaultTitle: string = DreamTitle;
  today: Date = new Date();

  _navMenuType: typeof NavMenuType = NavMenuType;
  _dreamMode: typeof DreamMode = DreamMode;

  dreamForm: FormGroup;
  dreamId: number = 0;
  dream: Dream;
  private fromMark: string;
  errors: ErrorMessagesType = DreamErrorMessages;

  oldUser: User;

  titleMinLength: number = FormData.dreamTitleMinLength;
  titleMaxLength: number = FormData.dreamTitleMaxLength;
  descriptionMaxLength: number = FormData.dreamDescriptionMaxLength;
  keywordsMaxLength: number = 500;
  dateMin: Date = new Date();
  dateMax: Date = new Date();
  dreamModes: OptionData[] = DreamModes;
  dreamStatuses: OptionData[] = DreamStatuses;

  private destroy$: Subject<void> = new Subject<void>();





  // Текущий пользователя
  get user(): User {
    return AppComponent.user;
  };

  // Кнопка назад: URL
  get backLink(): string {
    const fromArray: string[] = this.fromMark.split("|") || [];
    const from: string = fromArray[fromArray.length - 1] || "";
    // Список всех сновидений
    if (from === "diary-all") {
      return "/diary/all";
    }
    // Просмотр сновидения
    else if (from === "diary-viewer") {
      return "/diary/viewer/" + this.dream.id;
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





  constructor(
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService,
    private router: Router
  ) {
    this.dreamId = parseInt(this.activatedRoute.snapshot.params.dreamId);
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
    this.dreamForm.get("title").valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => this.onChangeTitle(value || ""));
    this.dreamForm.get("date").valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => this.onChangeDate(value || new Date()));
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





  // Сохранение
  onSave(): void {
    const status: DreamStatus = this.dreamForm.invalid ? DreamStatus.draft : this.dreamForm.get("status").value as DreamStatus;
    // Подсветить ошибки
    if (this.dreamForm.invalid) {
      this.dreamForm.markAllAsTouched();
    }
    // Сохранить
    if (this.dream.id === 0 || (this.dream.id > 0 && (this.dreamForm.valid || status === DreamStatus.draft))) {
      this.dream.description = this.dreamForm.get("description").value as string;
      this.dream.mode = parseInt(this.dreamForm.get("mode").value) as DreamMode || DreamMode.mixed;
      this.dream.status = status;
      this.dream.keywords = this.dreamForm.get("keywords").value as string[];
      this.dream.text = this.dreamForm.get("text").value as string;
      this.dream.map = this.mapEditor ? this.mapEditor.getMap : this.dream.map;
      // Сохранение
      this.dreamService.save(this.dream).subscribe(
        id => {
          this.dream.id = id;
          // Добавить ID в URL
          this.router.navigate(["diary", "editor", id.toString()], { queryParamsHandling: "merge", replaceUrl: true });
          // Уведомление о сохранении
          this.snackbarService.open({
            message: "Сновидение успешно сохранено",
            mode: "success"
          });
        }
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

  // Изменение даты сновидения
  private onChangeDate(date: Date): void {
    this.dream.date = date;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменить настройки оформления
  onChangeSettings(settings: NavMenuSettingData): void {
    this.dream.headerBackground = BackgroundImageDatas.find(b => b.id === settings.backgroundId);
    this.dream.headerType = settings.navMenuType;
  }

  // Переключение вкладки
  onChangeTab(index: number): void {
    this.mainMenu.collapseMenu()
  }





  // Определить данные
  private defineData(): void {
    // Редактирование сновидения
    if (this.dreamId > 0) {
      this.dreamService.getById(this.dreamId, true).subscribe(
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
      this.dream = this.dreamService.newDream;
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
