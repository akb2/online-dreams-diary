import { DreamMapEditorComponent } from "@_controlers/dream-map-editor/dream-map-editor.component";
import { NavMenuSettingData } from "@_controlers/nav-menu-settings/nav-menu-settings.component";
import { NavMenuComponent } from "@_controlers/nav-menu/nav-menu.component";
import { ToDate } from "@_datas/app";
import { BackgroundImageDatas } from "@_datas/appearance";
import { DreamModes, DreamMoods, DreamStatuses, DreamTypes } from "@_datas/dream";
import { DreamTitle } from "@_datas/dream-map-settings";
import { DreamErrorMessages, DreamValidatorData, FormData } from "@_datas/form";
import { ParseInt } from "@_helpers/math";
import { CompareObjects } from "@_helpers/objects";
import { User } from "@_models/account";
import { SimpleObject } from "@_models/app";
import { Dream, DreamMode, DreamMood, DreamStatus, DreamType } from "@_models/dream";
import { DreamMap } from "@_models/dream-map";
import { ErrorMessagesType, OptionData } from "@_models/form";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { DreamService } from "@_services/dream.service";
import { GlobalService } from "@_services/global.service";
import { SnackbarService } from "@_services/snackbar.service";
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
  @ViewChild(DreamMapEditorComponent) mapEditor!: DreamMapEditorComponent;

  imagePrefix: string = "../../../../assets/images/backgrounds/";
  ready: boolean = false;
  loading: boolean = false;
  selectedTab: number = 2;
  private pageTitle: string[] = [
    "pages.diary_editor.page_titles.new",
    "pages.diary_editor.page_titles.edit"
  ];

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

  user: User;

  titleMinLength: number = FormData.dreamTitleMinLength;
  titleMaxLength: number = FormData.dreamTitleMaxLength;
  descriptionMaxLength: number = FormData.dreamDescriptionMaxLength;
  keywordsMaxLength: number = 500;
  dateMin: Date = new Date();
  dateMax: Date = new Date();
  dreamModes: OptionData[] = DreamModes;
  dreamStatuses: OptionData[] = DreamStatuses;
  dreamTypes: OptionData[] = DreamTypes;
  dreamMoods: OptionData[] = DreamMoods;

  private destroyed$: Subject<void> = new Subject<void>();





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
    // Из профиля
    else if (from === "profile") {
      return "/profile/" + this.dream.user?.id;
    }
    // Мой дневник
    return "/diary/" + this.dream.user?.id;
  }

  // Кнопка назад: параметры
  get backLinkParams(): SimpleObject {
    const fromArray: string[] = this.fromMark.split("|") || [];
    const fromMark: string = fromArray.filter((v, k) => k < fromArray.length - 1).join("|");
    // Вернуть значение
    return fromMark ? { from: fromMark } : {};
  }

  // Года в дату
  ageToDate(age: number): Date {
    return new Date(Date.now() - (age * 365 * 24 * 60 * 60 * 1000));
  }

  // Доступна ли карта
  private get isMapAvail(): boolean {
    const mode: DreamMode = ParseInt(this.dreamForm.get("mode")?.value) as DreamMode;
    // Проверка
    return mode === DreamMode.map || mode === DreamMode.mixed;
  }

  // Доступен ли текст
  get isTextAvail(): boolean {
    const mode: DreamMode = ParseInt(this.dreamForm.get("mode")?.value) as DreamMode;
    // Проверка
    return mode === DreamMode.text || mode === DreamMode.mixed;
  }

  // Текущий режим
  get getCurrentMode(): DreamMode {
    return ParseInt(this.dreamForm.get("mode")?.value) as DreamMode;
  }

  // Проверка изменений
  private get formHasChanges(): boolean {
    const title: string = this.dreamForm.get("title")?.value?.toString() ?? "";
    const description: string = this.dreamForm.get("description")?.value?.toString() ?? "";
    const date: Date = ToDate(this.dreamForm.get("date")?.value);
    const headerType: NavMenuType = this.dreamForm.get("headerType")?.value?.toString() as NavMenuType;
    const headerBackground: number = ParseInt(this.dreamForm.get("headerBackground")?.value);
    const mode: DreamMode = ParseInt(this.dreamForm.get("mode")?.value) as DreamMode;
    const type: DreamType = ParseInt(this.dreamForm.get("type")?.value) as DreamType;
    const mood: DreamMood = ParseInt(this.dreamForm.get("mood")?.value) as DreamMood;
    const status: DreamStatus = this.dreamForm.invalid ? DreamStatus.draft : ParseInt(this.dreamForm.get("status").value) as DreamStatus;
    const keywords: string = ((this.dreamForm.get("keywords")?.value as string[]) ?? []).sort().join(",");
    const text: string = (this.dreamForm.get("text")?.value?.toString() as string) ?? "";
    const map: DreamMap = this.mapEditor ? this.mapEditor.getMap : this.dream.map;
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
      this.dream.keywords.sort().join(",") !== keywords ||
      (this.isTextAvail && this.dream.text !== text) ||
      (this.isMapAvail && !CompareObjects(this.dream.map, map))
    );
  }

  // Дата сновидения
  get dreamDate(): Date {
    return ToDate(this.dreamForm?.get('date')?.value ?? this.today);
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
    this.dreamId = ParseInt(this.activatedRoute.snapshot.params.dreamId);
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
    // Изменения названия
    this.dreamForm.get("title").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onChangeTitle(value ?? ""));
    // Изменение даты
    this.dreamForm.get("date").valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(value => this.onChangeDate(value ?? new Date()));
  }

  ngOnInit() {
    this.defineData();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Сохранение
  onSave(): void {
    if (!this.loading) {
      const status: DreamStatus = this.dreamForm.invalid ? DreamStatus.draft : ParseInt(this.dreamForm.get("status").value) as DreamStatus;
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
        this.dream.description = this.dreamForm.get("description").value as string;
        this.dream.mode = ParseInt(this.dreamForm.get("mode")?.value) as DreamMode;
        this.dream.type = ParseInt(this.dreamForm.get("type")?.value) as DreamType;
        this.dream.mood = ParseInt(this.dreamForm.get("mood")?.value) as DreamMood;
        this.dream.status = status;
        this.dream.date = ToDate(this.dreamForm.get("date")?.value);
        this.dream.keywords = this.dreamForm.get("keywords").value as string[];
        this.dream.text = this.dreamForm.get("text").value as string;
        this.dream.map = this.mapEditor ? this.mapEditor.getMap : this.dream.map;
        this.dream.headerType = this.dreamForm.get("headerType")?.value?.toString() as NavMenuType ?? NavMenuType.collapse;
        this.dream.headerBackground = BackgroundImageDatas.find(b => b.id === ParseInt(this.dreamForm.get("headerBackground")?.value)) ?? BackgroundImageDatas[0];
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

  // Изменение названия сновидения
  private onChangeTitle(title: string): void {
    this.dream.title = title;
    // Обновить название страницы
    this.setTitle();
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение даты сновидения
  private onChangeDate(date: Date): void {
    this.dreamForm.get("date").setValue(date ?? this.today, { emitEvent: false });
  }

  // Изменить настройки оформления
  onChangeSettings(settings: NavMenuSettingData): void {
    this.dreamForm.get("headerType").setValue(settings.navMenuType);
    this.dreamForm.get("headerBackground").setValue(settings.backgroundId);
  }

  // Переключение вкладки
  onChangeTab(index: number): void {
    this.mainMenu.collapseMenu();
  }





  // Определить данные
  private defineData(): void {
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
  private createForm(): void {
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
  private setTitle(): void {
    this.titleService.setTitle(this.globalService.createTitle([
      this.dream.title,
      this.translateService.instant(this.pageTitle[!!this.dream.id ? 1 : 0])
    ]))
  }
}
