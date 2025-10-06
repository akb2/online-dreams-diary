import { Editor3DComponent } from "@_controlers/editor-3d/editor-3d.component";
import { NavMenuSettingData } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { AnyToDate } from "@_datas/app";
import { BackgroundImageDatas } from "@_datas/appearance";
import { DreamModes, DreamMoods, DreamStatuses, DreamTypes } from "@_datas/dream";
import { DreamTitle } from "@_datas/dream-map-settings";
import { DreamErrorMessages, DreamValidatorData, FormData } from "@_datas/form";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { Dream, DreamMode, DreamMood, DreamStatus, DreamType } from "@_models/dream";
import { DreamMap } from "@_models/dream-map";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService } from "@_services/dream.service";
import { GlobalService } from "@_services/global.service";
import { SnackbarService } from "@_services/snackbar.service";
import { anyToArray, anyToInt, anyToString } from "@akb2/types-tools";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { Subject, of, throwError } from "rxjs";
import { mergeMap, switchMap, takeUntil } from "rxjs/operators";



@Component({
  selector: "app-diary-editor",
  templateUrl: "./diary-editor.component.html",
  styleUrls: ["./diary-editor.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiaryEditorComponent implements OnInit, OnDestroy {
  @ViewChild(NavMenuComponent) mainMenu!: NavMenuComponent;
  @ViewChild(Editor3DComponent) mapEditor!: Editor3DComponent;

  imagePrefix = "../../../../assets/images/backgrounds/";
  ready = false;
  loading = false;
  selectedTab = 2;
  private pageTitle: string[] = [
    "pages.diary_editor.page_titles.new",
    "pages.diary_editor.page_titles.edit"
  ];

  navMenuType = NavMenuType.collapse;
  private readonly defaultTitle = DreamTitle;

  _navMenuType = NavMenuType;
  _dreamMode = DreamMode;

  dreamForm: FormGroup;
  dreamId = 0;
  dream: Dream;
  private fromMark: string;
  errors = DreamErrorMessages;

  user: User;

  titleMinLength = FormData.dreamTitleMinLength;
  titleMaxLength = FormData.dreamTitleMaxLength;
  descriptionMaxLength = FormData.dreamDescriptionMaxLength;
  keywordsMaxLength = 500;
  dateMin = new Date();
  dateMax = new Date();
  dreamModes = DreamModes;
  dreamStatuses = DreamStatuses;
  dreamTypes = DreamTypes;
  dreamMoods = DreamMoods;

  private destroyed$: Subject<void> = new Subject<void>();



  get today(): Date {
    return new Date();
  }

  // Кнопка назад: URL
  get backLink(): string {
    const fromArray = anyToArray(this.fromMark.split("|"));
    const from = anyToString(fromArray[fromArray.length - 1]);
    // Список всех сновидений
    if (from === "diary-all") {
      return "/diary/all";
    }
    // Просмотр сновидения
    else if (from === "diary-viewer") {
      return "/diary/viewer/" + this.dream.id;
    }
    // Из профиля
    else if (from === "profile") {
      return "/profile/" + this.dream.user?.id;
    }
    // Мой дневник
    return "/diary/" + this.dream.user?.id;
  }

  // Кнопка назад: параметры
  get backLinkParams(): SimpleObject {
    const fromArray = anyToArray(this.fromMark.split("|"));
    const fromMark = fromArray.filter((v, k) => k < fromArray.length - 1).join("|");
    // Вернуть значение
    return fromMark
      ? { from: fromMark }
      : {};
  }

  // Года в дату
  ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }

  // Доступна ли карта
  private get isMapAvail(): boolean {
    const mode = anyToInt(this.dreamForm.get("mode")?.value) as DreamMode;
    // Проверка
    return mode === DreamMode.map || mode === DreamMode.mixed;
  }

  // Доступен ли текст
  get isTextAvail(): boolean {
    const mode: DreamMode = anyToInt(this.dreamForm.get("mode")?.value) as DreamMode;
    // Проверка
    return mode === DreamMode.text || mode === DreamMode.mixed;
  }

  // Текущий режим
  get getCurrentMode(): DreamMode {
    return anyToInt(this.dreamForm.get("mode")?.value) as DreamMode;
  }

  // Текущее название заголовка
  get currentTitle(): string {
    return anyToString(this.dreamForm?.get("title")?.value) || this.defaultTitle;
  }

  // Проверка изменений
  private get formHasChanges(): boolean {
    const title = anyToString(this.dreamForm.get("title")?.value);
    const description = anyToString(this.dreamForm.get("description")?.value);
    const date = AnyToDate(this.dreamForm.get("date")?.value);
    const headerType: NavMenuType = anyToString(this.dreamForm.get("headerType")?.value, NavMenuType.short) as NavMenuType;
    const headerBackground = anyToInt(this.dreamForm.get("headerBackground")?.value);
    const mode = anyToInt(this.dreamForm.get("mode")?.value) as DreamMode ?? DreamMode.mixed;
    const type = anyToInt(this.dreamForm.get("type")?.value) as DreamType ?? DreamType.Simple;
    const mood = anyToInt(this.dreamForm.get("mood")?.value) as DreamMood ?? DreamMood.Nothing;
    const status: DreamStatus = this.dreamForm.invalid
      ? DreamStatus.draft
      : anyToInt(this.dreamForm.get("status").value) as DreamStatus;
    const keywords = anyToArray(this.dreamForm.get("keywords")?.value).sort().join(",");
    const text = anyToString(this.dreamForm.get("text")?.value);
    const map: DreamMap = this.mapEditor
      ? this.mapEditor.getMap
      : this.dream.map;
    // Проверка
    return (
      this.dream.title !== title ||
      this.dream.description !== description ||
      this.dream.date.toISOString() !== date.toISOString() ||
      this.dream.headerType !== headerType ||
      this.dream.headerBackground.id !== headerBackground ||
      this.dream.mode !== mode ||
      this.dream.type !== type ||
      this.dream.mood !== mood ||
      this.dream.status !== status ||
      anyToArray(this.dream.keywords).sort().join(",") !== keywords ||
      (this.isTextAvail && this.dream.text !== text) ||
      (this.isMapAvail && !!map.isChanged)
    );
  }

  // Дата сновидения
  get dreamDate(): Date {
    return AnyToDate(this.dreamForm?.get('date')?.value ?? this.today);
  }



  constructor(
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private dreamService: DreamService,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService,
    private router: Router,
    private titleService: Title,
    private globalService: GlobalService,
    private translateService: TranslateService
  ) {
    this.dreamId = anyToInt(this.activatedRoute.snapshot.params.dreamId);
    this.dreamId = isNaN(this.dreamId) ? 0 : this.dreamId;
    // Форма сновидений
    this.dreamForm = this.formBuilder.group({
      title: ["", DreamValidatorData.title],
      description: [""],
      mode: [DreamMode.text],
      type: [DreamType.Simple],
      mood: [DreamMood.Nothing],
      status: [DreamStatus.draft],
      date: [new Date()],
      keywords: [[]],
      text: [""],
      headerType: [null],
      headerBackground: [null]
    });
  }

  ngOnInit() {
    this.defineData();
    // Изменения названия
    this.dreamForm.get("title").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.setTitle());
    // Изменение даты
    this.dreamForm.get("date").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onChangeDate(value ?? this.today));
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }



  // Сохранение
  onSave() {
    if (!this.loading) {
      const status: DreamStatus = this.dreamForm.invalid
        ? DreamStatus.draft
        : anyToInt(this.dreamForm.get("status").value) as DreamStatus;
      // Подсветить ошибки
      if (this.dreamForm.invalid) {
        this.dreamForm.markAllAsTouched();
      }
      // Нет изменений
      else if (!this.formHasChanges) {
        this.snackbarService.open({
          message: this.translateService.instant("pages.diary_editor.notifications.no_changes_for_save"),
          mode: "error"
        });
      }
      // Сохранить
      else if (this.dream.id === 0 || (this.dream.id > 0 && (this.dreamForm.valid || status === DreamStatus.draft))) {
        const headerBackground = anyToInt(this.dreamForm.get("headerBackground")?.value);
        // Свойства
        this.dream.title = anyToString(this.dreamForm.get("title")?.value);
        this.dream.description = anyToString(this.dreamForm.get("description")?.value);
        this.dream.mode = anyToInt(this.dreamForm.get("mode")?.value) as DreamMode ?? DreamMode.mixed;
        this.dream.type = anyToInt(this.dreamForm.get("type")?.value) as DreamType ?? DreamType.Simple;
        this.dream.mood = anyToInt(this.dreamForm.get("mood")?.value) as DreamMood ?? DreamMood.Nothing;
        this.dream.status = status;
        this.dream.date = AnyToDate(this.dreamForm.get("date")?.value);
        this.dream.keywords = anyToArray(this.dreamForm.get("keywords")?.value);
        this.dream.text = anyToString(this.dreamForm.get("text")?.value);
        this.dream.map = this.mapEditor
          ? this.mapEditor.getMap
          : this.dream.map;
        this.dream.headerType = anyToString(this.dreamForm.get("headerType")?.value) as NavMenuType ?? NavMenuType.collapse;
        this.dream.headerBackground = BackgroundImageDatas.find(b => b.id === headerBackground) ?? BackgroundImageDatas[0];
        // Лоадер
        this.loading = true;
        this.changeDetectorRef.detectChanges();
        // Сохранение
        this.dreamService.save(this.dream)
          .pipe(takeUntil(this.destroyed$))
          .subscribe(
            id => {
              this.dream.id = id;
              this.loading = false;
              this.dream.map.isChanged = false;
              this.changeDetectorRef.detectChanges();
              // Добавить ID в URL
              this.router.navigate(["diary", "editor", id.toString()], { queryParamsHandling: "merge", replaceUrl: true });
              // Уведомление о сохранении
              this.snackbarService.open({
                message: this.translateService.instant("pages.diary_editor.notifications.save_success"),
                mode: "success"
              });
            },
            () => {
              this.loading = false;
              this.changeDetectorRef.detectChanges();
            }
          );
      }
    }
  }

  // Изменение даты сновидения
  private onChangeDate(date: Date) {
    this.dreamForm.get("date").setValue(date ?? this.today, { emitEvent: false });
  }

  // Изменить настройки оформления
  onChangeSettings(settings: NavMenuSettingData) {
    this.dreamForm.get("headerType").setValue(settings.navMenuType);
    this.dreamForm.get("headerBackground").setValue(settings.backgroundId);
  }

  // Переключение вкладки
  onChangeTab(index: number) {
    this.mainMenu.collapseMenu();
    this.selectedTab = anyToInt(index);
    // Обнаружить изменения
    this.changeDetectorRef.detectChanges();
  }



  // Определить данные
  private defineData() {
    this.accountService.user$()
      .pipe(
        switchMap(user => !!user ? of(user) : throwError(null)),
        mergeMap(
          () => this.activatedRoute.queryParams,
          (user, params) => ({ user, params })
        ),
        mergeMap(
          () => this.dreamId > 0
            ? this.dreamService.getById(this.dreamId, true)
            : of(this.dreamService.newDream),
          (o, dream) => ({ ...o, dream })
        ),
        switchMap(r => !!r.dream ? of(r) : throwError(null)),
        takeUntil(this.destroyed$)
      )
      .subscribe(
        ({ user, params, dream }) => {
          this.user = user;
          this.dateMin = new Date(this.user.birthDate);
          this.fromMark = params.from?.toString() || "";
          this.dream = dream;
          this.dream.user = dream.user ?? user;
          // Создать форму
          this.createForm();
          this.setTitle();
          // Обновить
          this.changeDetectorRef.detectChanges();
        },
        () => this.router.navigate(["404"])
      );
  }

  // Создать форму
  private createForm() {
    this.dreamForm.get("title").setValue(this.dream.title);
    this.dreamForm.get("description").setValue(this.dream.description);
    this.dreamForm.get("mode").setValue(this.dream.mode.toString());
    this.dreamForm.get("type").setValue(this.dream.type.toString());
    this.dreamForm.get("mood").setValue(this.dream.mood.toString());
    this.dreamForm.get("status").setValue(this.dream.status.toString());
    this.dreamForm.get("date").setValue(this.dream.date);
    this.dreamForm.get("keywords").setValue(this.dream.keywords);
    this.dreamForm.get("text").setValue(this.dream.text);
    this.dreamForm.get("headerType").setValue(this.dream.headerType);
    this.dreamForm.get("headerBackground").setValue(this.dream.headerBackground.id);
    // Отметить готовность
    this.ready = true;
  }

  // Установить название страницы
  private setTitle() {
    this.titleService.setTitle(this.globalService.createTitle([
      this.currentTitle,
      this.translateService.instant(this.pageTitle[!!this.dream.id ? 1 : 0])
    ]))
  }
}
