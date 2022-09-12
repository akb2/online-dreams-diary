import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DefaultExtraDatas, ExtraDatas as ExtraDatasApp } from '@app/app.component';
import { OptionData } from '@_controlers/autocomplete-input/autocomplete-input.component';
import { PaginateEvent } from '@_controlers/pagination/pagination.component';
import { SearchPanelComponent } from '@_controlers/search-panel/search-panel.component';
import { PeoplePlural, User, UserSex } from '@_models/account';
import { CustomObject, CustomObjectKey, SimpleObject } from '@_models/app';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { FormData, MonthPlural } from '@_models/form';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService, SearchUser } from '@_services/account.service';
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
  pageCount: number = 1;

  searchForm: FormGroup;
  birthYears: OptionData[] = [];
  birthMonths: OptionData[] = [];
  birthDays: OptionData[] = [];
  sexes: OptionData[] = Sexes;

  peoplePlural: SimpleObject = PeoplePlural;

  private monthPlural: string[] = MonthPlural;

  private queryParams: SimpleObject = {};

  private destroy$: Subject<void> = new Subject<void>();





  // Показывать ли нижний пагинатор
  get bottomPaginationIsAvail(): boolean {
    return this.pageCount > this.pageLimit / 2;
  }

  // Данные поиска
  private get getSearch(): SearchUser {
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
  private get getCurrentSearch(): SearchUser {
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
  private get getDefaultSearch(): SearchUser {
    return {
      q: "",
      sex: "",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      page: 1
    };
  }

  // Дополнительные данные страницы
  private get getExtraDatas(): ExtraDatas {
    const extraDatas: CustomObject<any> = this.router.getCurrentNavigation()?.extras.state ?? {};
    // Найти данные
    return Object.entries({ DefaultExtraDatas, noUpdateSearch: false })
      .map(([k, v]) => ([k, extraDatas.hasOwnProperty(k) ? !!extraDatas[k] : v]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: !!v }), {} as ExtraDatas);
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private screenService: ScreenService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group(Object.entries(this.getDefaultSearch)
      .filter(([k]) => k !== "page")
      .reduce((o, [k, v]) => ({ ...o, [k]: [v, null] }), {})
    );
    // Заполнить списки выбора
    this.fillYearsOptionData();
    this.fillMonthsOptionData();
    // Изменение списка дней
    merge(this.searchForm.get("birthMonth").valueChanges, this.searchForm.get("birthYear").valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.fillDaysOptionData());
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      const { noUpdateSearch }: ExtraDatas = this.getExtraDatas;
      // Данные из URL
      this.queryParams = params as SimpleObject;
      this.pageCurrent = parseInt(params.page) || 1;
      // Наполнить форму
      Object.entries(this.getCurrentSearch)
        .filter(([k]) => k !== "page")
        .forEach(([k, v]) => this.searchForm.get(k)?.setValue(v));
      // Поиск пользователей
      if (!noUpdateSearch) {
        this.search();
      }
    });
    // Подписка на тип устройства
    this.screenService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isMobile => {
        this.isMobile = isMobile;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

  // Заполнить список месяцев
  private fillDaysOptionData(): void {
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
    this.urlSet(this.getSearch, true);
    // Обновить
    this.changeDetectorRef.detectChanges();
  }





  // Загрузка списка сновидений
  private search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Загрузка списка
    this.accountService.search(this.getSearch, ["0002"]).subscribe(
      ({ count, result: people, limit }) => {
        // Найдены сновидения
        if (count > 0) {
          this.peopleCount = count;
          this.pageLimit = limit;
          this.pageCount = people.length;
          this.people = people;
          this.loading = false;
          // Обновить
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
  private urlSet(datas: SearchUser | CustomObject<string | number>, noUpdateSearch: boolean = false): void {
    const path: string[] = (this.router.url.split("?")[0]).split("/").filter(v => v.length > 0);
    const queryParams: CustomObject<string | number | null> = Object.entries({ ...this.queryParams, ...datas })
      .map(([k, v]) => ([k, !!v ? v : null]))
      .reduce((o, [k, v]) => ({ ...o, [k as string]: v }), {});
    // Перейти к новой странице
    this.router.navigate(path, {
      queryParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
      state: {
        changeTitle: false,
        showPreLoader: false,
        noUpdateSearch
      }
    });
  }
}





// Интерфейс дополнительных данных страницы
interface ExtraDatas extends ExtraDatasApp {
  noUpdateSearch: boolean;
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
