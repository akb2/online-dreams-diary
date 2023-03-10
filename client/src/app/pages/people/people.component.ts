import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginateEvent } from '@_controlers/pagination/pagination.component';
import { SearchPanelComponent } from '@_controlers/search-panel/search-panel.component';
import { PeoplePlural } from "@_datas/account";
import { ObjectToUrlObject } from "@_datas/api";
import { BackgroundImageDatas } from '@_datas/appearance';
import { FormData, MonthPlural } from '@_datas/form';
import { CompareObjects } from "@_helpers/objects";
import { SearchUser, User, UserSex } from '@_models/account';
import { ExcludeUrlObjectValues } from "@_models/api";
import { CustomObject, CustomObjectKey, SimpleObject } from '@_models/app';
import { BackgroundImageData } from '@_models/appearance';
import { OptionData } from "@_models/form";
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { CanonicalService } from '@_services/canonical.service';
import { ScreenService } from '@_services/screen.service';
import { merge, Subject, takeUntil } from 'rxjs';





@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PeopleComponent implements OnInit, OnDestroy {


  @ViewChild("searchPanel") private searchPanel!: SearchPanelComponent;


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 10);

  navMenuType: NavMenuType = NavMenuType.collapse;

  loading: boolean = true;
  isMobile: boolean = false;

  people: User[];
  peopleCount: number = 0;

  pageCurrent: number = 1;
  pageLimit: number = 24;
  private defaultPageLimit: number = 24;
  pageCount: number = 1;

  searchForm: FormGroup;
  birthYears: OptionData[] = [];
  birthMonths: OptionData[] = [];
  birthDays: OptionData[] = [];
  sexes: OptionData[] = Sexes;

  peoplePlural: SimpleObject = PeoplePlural;

  private monthPlural: string[] = MonthPlural;

  private queryParams: SimpleObject = {};

  private destroyed$: Subject<void> = new Subject<void>();





  // Показывать ли нижний пагинатор
  get bottomPaginationIsAvail(): boolean {
    return this.pageCount > this.pageLimit / 2;
  }

  // Данные поиска
  private get getSearch(): Partial<SearchUser> {
    const page: number = this.pageCurrent > 0 ? this.pageCurrent : 1;
    const fromForm: CustomObjectKey<keyof SearchUser, string | number> = Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k]) => ({ ...o, [k]: this.searchForm.get(k)?.value?.toString() ?? "" }), {});
    // Вернуть данные
    return {
      ...fromForm,
      page,
      limit: this.pageLimit
    };
  }

  // Текущие данные из URL
  private get getCurrentSearch(): Partial<SearchUser> {
    const page: number = parseInt(this.queryParams.page) > 0 ? parseInt(this.queryParams.page) : 1;
    const fromForm: CustomObjectKey<keyof SearchUser, string | number> = Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k]) => ({ ...o, [k]: this.queryParams[k] as string ?? "" }), {});
    // Вернуть данные
    return {
      ...fromForm,
      page,
    };
  }

  // Пустые данные
  private get getDefaultSearch(): Partial<SearchUser> {
    return {
      q: "",
      sex: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      page: 1
    };
  }

  // Задействован поиск
  get getIsSearch(): boolean {
    return !CompareObjects(this.getDefaultSearch, this.getCurrentSearch);
  }

  // Значения для URl подлежащие сключению
  private get getExcludeParams(): ExcludeUrlObjectValues {
    return {
      page: [0, 1],
      limit: true
    };
  }

  // Список слов поиска
  get getSearchWords(): string[] {
    return (this.queryParams?.q ?? "").split(" ").filter(w => !!w);
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private screenService: ScreenService,
    private formBuilder: FormBuilder,
    private canonicalService: CanonicalService
  ) {
    this.searchForm = this.formBuilder.group(Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k, v]) => ({ ...o, [k]: [v, null] }), {})
    );
    // Заполнить списки выбора
    this.fillYearsOptionData();
    this.fillMonthsOptionData();
  }

  ngOnInit() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        this.queryParams = params as SimpleObject;
        this.pageCurrent = parseInt(params.page) || 1;
        // Наполнить форму
        Object.entries(this.getCurrentSearch)
          .filter(([k]) => k !== "page")
          .forEach(([k, v]) => this.searchForm.get(k)?.setValue(v));
        // Поиск пользователей
        this.search();
      });
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
    // Изменение списка дней
    merge(this.searchForm.get("birthMonth").valueChanges, this.searchForm.get("birthYear").valueChanges)
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.fillDaysOptionData());
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Сновидения не найдены
  private onNotPeopleFound(): void {
    this.peopleCount = 0;
    this.people = [];
    this.loading = false;
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Изменение страницы
  onPageChange(event: PaginateEvent): void {
    this.pageCurrent = event.pageCurrent;
    // Изменить URL
    this.urlSet(this.getSearch);
  }

  // Событие поиска
  onSearch(): void {
    this.urlSet(this.getSearch);
  }

  // Сбросить поиск
  onClear(): void {
    this.urlSet(this.getDefaultSearch);
  }





  // Заполнить список годов
  private fillYearsOptionData(): void {
    const currYear: number = (new Date()).getFullYear();
    const minYear: number = FormData.birthDateProjectYear - FormData.birthDateMaxAge;
    const maxYear: number = currYear - FormData.birthDateMinAge;
    const yearsPeriod: number = maxYear - minYear + 1;
    // Заполнить данные
    this.birthYears = (new Array(yearsPeriod)).fill(1).map((k, i) => (maxYear - i).toString()).map(year => ({
      key: year.toString(),
      iconColor: "primary",
      title: year.toString()
    }));
    // Добавить пункт любой год
    this.birthYears.unshift({
      key: "",
      title: "Любой год"
    });
  }

  // Заполнить список месяцев
  private fillMonthsOptionData(): void {
    // Заполнить данные
    this.birthMonths = (new Array(this.monthPlural.length)).fill(1).map((k, i) => ({
      key: (i + 1).toString(),
      iconColor: "primary",
      title: this.monthPlural[i].toString()
    }));
    // Добавить пункт любой месяц
    this.birthMonths.unshift({
      key: "",
      title: "Любой месяц"
    });
  }

  // Заполнить список дней
  fillDaysOptionData(): void {
    const year: number = parseInt(this.getSearch.birthYear) || 0;
    const month: number = (parseInt(this.getSearch.birthMonth) || 0);
    const days: number = year === 0 && month === 2 ? 29 : new Date(year, month, 0).getDate();
    const day: number = parseInt(this.getSearch.birthDay) || 0;
    const newDay: string = day > days ? "" : (day > 0 ? day : "").toString();
    // Заполнить данные
    this.birthDays = (new Array(days)).fill(1).map((k, i) => (i + 1).toString()).map(key => ({
      key,
      iconColor: "primary",
      title: key
    }));
    // Добавить пункт любой месяц
    this.birthDays.unshift({
      key: "",
      title: "Любой день"
    });
    // Изменить значение, если оно не вписывается в массив
    this.searchForm.get("birthDay").setValue(newDay);
    // Обновить
    this.changeDetectorRef.detectChanges();
  }

  // Загрузка списка сновидений
  private search(): void {
    const search: Partial<SearchUser> = this.getSearch;
    // Загрузка
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Загрузка списка
    this.accountService.search({ ...search, sortType: !!search?.q ? "asc" : "desc" }, ["0002"]).subscribe(
      ({ count, result: people, limit }) => {
        // Найдены сновидения
        if (count > 0) {
          this.peopleCount = count;
          this.pageLimit = limit;
          this.pageCount = people.length;
          this.people = people;
          this.loading = false;
          // Обновить
          this.canonicalService.setURL("people", this.getSearch, this.getExcludeParams);
          this.changeDetectorRef.detectChanges();
        }
        // Сновидения не найдены
        else {
          this.onNotPeopleFound();
        }
      },
      () => this.onNotPeopleFound()
    );
  }

  // Показать фильтры
  openSearch(): void {
    this.searchPanel?.openPanel();
  }

  // Записать параметры в URL
  private urlSet(datas: Partial<SearchUser>): void {
    const path: string[] = (this.router.url.split("?")[0]).split("/").filter(v => v.length > 0);
    const queryParams: CustomObject<string | number> = Object.entries(ObjectToUrlObject({ ...this.queryParams, ...datas }, "", this.getExcludeParams))
      .map(([k, v]) => ([k, !!v ? v : null]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: v }), {});
    // Перейти к новой странице
    this.router.navigate(path, {
      queryParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
      state: {
        changeTitle: false,
        showPreLoader: false
      }
    });
  }
}





// Массив полов пользователей для поиска
const Sexes: OptionData[] = [
  // Любой пол
  {
    key: "",
    title: "Любой пол",
    icon: "wc",
    iconColor: "disabled"
  },
  // Мужской пол
  {
    key: UserSex.Male.toString(),
    title: "Мужской",
    icon: "man",
    iconColor: "primary"
  },
  // Женский пол
  {
    key: UserSex.Female.toString(),
    title: "Женский",
    icon: "woman",
    iconColor: "warn"
  }
];
