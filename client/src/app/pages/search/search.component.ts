import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ObjectToUrlObject } from "@_datas/api";
import { BackgroundImageDatas } from "@_datas/appearance";
import { SearchUser, User } from "@_models/account";
import { ExcludeUrlObjectValues } from "@_models/api";
import { CustomObject, SimpleObject } from "@_models/app";
import { BackgroundImageData } from "@_models/appearance";
import { Dream, SearchDream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { CanonicalService } from "@_services/canonical.service";
import { DreamService } from "@_services/dream.service";
import { forkJoin, Subject, takeUntil } from "rxjs";





@Component({
  selector: "page-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SearchComponent implements OnInit, OnDestroy {


  navMenuType: NavMenuType = NavMenuType.collapse;
  imagePrefix: string = "../../../../assets/images/backgrounds/";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 10);

  loading: boolean = false;

  dreamsLimit: number = 4;
  peopleLimit: number = 8;

  private queryParams: SimpleObject = {};
  searchForm: FormControl;
  people: User[];
  dreams: Dream[];

  private destroyed$: Subject<void> = new Subject();





  // Значения для URl подлежащие сключению
  private get getExcludeParams(): ExcludeUrlObjectValues {
    return { limit: true };
  }

  // Данные поиска
  get getSearch(): Partial<SearchUser> {
    const q: string = !!this.searchForm?.value?.toString() ? this.searchForm?.value?.toString() : null;
    // Вернуть данные
    return { q };
  }

  // Текущий запрос
  get getSearchValue(): string {
    return this.searchForm?.value?.toString() ?? "";
  }

  // Есть запрос для поска
  get isSearching(): boolean {
    return !!this.queryParams?.q?.length;
  }

  // Проверка наличия результатов
  get hasResults(): boolean {
    return !!this.people?.length || !!this.dreams?.length;
  }

  // Список слов поиска
  get getSearchWords(): string[] {
    return (this.queryParams?.q ?? "").split(" ").filter(w => !!w);
  }





  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private accountService: AccountService,
    private dreamService: DreamService,
    private canonicalService: CanonicalService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.searchForm = this.formBuilder.control("");
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroyed$))
      .subscribe(params => {
        const search: string = params?.q?.toString() ?? "";
        // Установить значение
        this.queryParams = params as SimpleObject;
        this.searchForm.setValue(search);
        // Поиск пользователей
        this.search();
      });
    // Изменения поиска
    this.searchForm.valueChanges
      .pipe(takeUntil(this.destroyed$))
      .subscribe(() => this.changeDetectorRef.detectChanges());
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Событие поиска
  onSearch(): void {
    this.urlSet({ q: this.searchForm?.value?.toString() });
  }





  // Поиск
  search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Параметры
    const q: string = this.searchForm?.value?.toString() ?? "";
    const peopleSearch: Partial<SearchUser> = {
      q,
      limit: this.peopleLimit,
      sortType: "desc"
    };
    const dreamsSearch: Partial<SearchDream> = { q, limit: this.dreamsLimit };
    const codes: string[] = ["0002"];
    // Запрос
    forkJoin({
      people: this.accountService.search(peopleSearch, codes),
      dreams: this.dreamService.search(dreamsSearch, codes)
    })
      .pipe(takeUntil(this.destroyed$))
      .subscribe(({ people, dreams }) => {
        this.loading = false;
        this.people = people.result;
        this.dreams = dreams.result;
        // Обновить
        this.canonicalService.setURL("search", this.getSearch, this.getExcludeParams);
        this.changeDetectorRef.detectChanges();
      });
  }

  // Записать параметры в URL
  private urlSet(datas: Partial<SearchUser>): void {
    const path: string[] = (this.router.url.split("?")[0]).split("/").filter(v => v.length > 0);
    const queryParams: CustomObject<string | number> = Object.entries(ObjectToUrlObject({ ...datas }, "", this.getExcludeParams))
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
