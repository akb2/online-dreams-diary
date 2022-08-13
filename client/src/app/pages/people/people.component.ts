import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginateEvent } from '@_controlers/pagination/pagination.component';
import { SearchPanelComponent } from '@_controlers/search-panel/search-panel.component';
import { User } from '@_models/account';
import { SimpleObject } from '@_models/app';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { NavMenuType } from '@_models/nav-menu';
import { ScreenService } from '@_services/screen.service';
import { SearchUser, UserService } from '@_services/user.service';
import { Subject, takeUntil } from 'rxjs';





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
  pageLimit: number = 1;
  pageCount: number = 1;

  peoplePlural: SimpleObject = {
    "=0": "",
    "=1": "# человек",
    "few": "# человека",
    "other": "# человек"
  };

  private queryParams: SimpleObject = {};

  private destroy$: Subject<void> = new Subject<void>();





  // Показывать ли нижний пагинатор
  get bottomPaginationIsAvail(): boolean {
    return this.pageCount > this.pageLimit / 2;
  }





  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private userService: UserService,
    private screenService: ScreenService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.queryParams = params as SimpleObject;
      this.pageCurrent = parseInt(params.p) || 1;
      // Поиск пользователей
      this.search();
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
    const path: string[] = (this.router.url.split("?")[0]).split("/").filter(v => v.length > 0);
    // Настройки
    this.pageCurrent = event.pageCurrent;
    // Перейти к новой странице
    this.router.navigate(path, {
      queryParams: { ...this.queryParams, p: event.pageCurrent },
      queryParamsHandling: "merge",
      replaceUrl: true,
      state: {
        changeTitle: false,
        showPreLoader: false
      }
    });
    // Обновить список
    this.search();
  }





  // Загрузка списка сновидений
  search(): void {
    this.loading = true;
    this.changeDetectorRef.detectChanges();
    // Поиск по сновидениям
    const search: SearchUser = {
      page: this.pageCurrent > 0 ? this.pageCurrent : 1
    };
    // Загрузка списка
    this.userService.search(search, ["0002"]).subscribe(
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
}
