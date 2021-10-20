import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, ActivatedRouteSnapshot } from "@angular/router";
import { User } from "@_models/account";
import { RouteData } from "@_models/app";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { Observable, Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";





@Component({
  selector: "app-diary",
  templateUrl: "./diary.component.html",
  styleUrls: ["./diary.component.scss"]
})

export class DiaryComponent implements OnInit, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";
  private pageData: RouteData;
  ready: boolean = false;

  title: string = "Общий дневник";
  subTitle: string = "Все публичные сновидения";
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 11);
  menuAvatarImage: string = "";
  menuAvatarIcon: string = "";

  navMenuType: typeof NavMenuType = NavMenuType;

  private destroy$: Subject<void> = new Subject<void>();

  public user: User;
  public currentUser: User;





  constructor(
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute
  ) {
  }

  ngOnInit() {
    this.defineData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      tap(user => this.currentUser = user)
    );
  }

  //
  private defineData(): void {
    let snapshots: ActivatedRouteSnapshot = this.activatedRoute.snapshot;
    while (snapshots.firstChild) {
      snapshots = snapshots.firstChild;
    }
    this.pageData = snapshots.data;

    // Мой дневник
    if (this.pageData.userId === 0) {
      this.subscribeUser().subscribe(user => {
        if (user) {
          this.title = user.name + " " + user.lastName;
          this.subTitle = "Мой дневник сновидений";
          this.backgroundImageData = user.settings.profileBackground;
          this.menuAvatarImage = user.avatars.middle;
          this.menuAvatarIcon = "person";
          // Отметить готовность
          this.ready = true;
        }
      });
    }
    // Общий дневник
    else if (this.pageData.userId === -1) {
      this.ready = true;
    }
  }
}





// Тип для заголовков
type StringType = [string, string, string];

// Тип для булевых
type BooleanType = [boolean, boolean, boolean];

// Тип страницы
type Type = 0 | 1 | 2;
