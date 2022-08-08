import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginateEvent } from '@_controlers/pagination/pagination.component';
import { User } from '@_models/account';
import { SimpleObject } from '@_models/app';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { NavMenuType } from '@_models/nav-menu';





@Component({
  selector: 'app-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PeopleComponent implements OnInit {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 8);

  navMenuType: NavMenuType = NavMenuType.collapse;

  loading: boolean = true;

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





  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => this.queryParams = params as SimpleObject);
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
  }


}
