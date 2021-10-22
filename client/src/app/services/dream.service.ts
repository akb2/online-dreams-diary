import { Injectable } from "@angular/core";
import { User } from "@_models/account";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamMode } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";
import { Observable, of } from "rxjs";





@Injectable({
  providedIn: "root"
})

export class DreamService {


  private currentUser: User;





  constructor(
    private accountService: AccountService
  ) {
    this.currentUser = this.accountService.getCurrentUser();
    // Подписка на актуальные сведения о пользователе
    this.accountService.user$.subscribe(user => user ? this.currentUser = user : null);
  }





  // Сформировать объект нового сновидения
  newDream(): Dream {
    return {
      id: 0,
      user: this.currentUser,
      createDate: null,
      date: new Date(),
      title: "",
      description: "",
      keywords: [],
      text: "",
      places: [],
      members: [],
      map: null,
      mode: DreamMode.map,
      headerType: NavMenuType.short,
      headerBackground: BackgroundImageDatas.find(b => b.id === 11)
    };
  }

  // Данные о сновидении
  getDream(id: number): Observable<Dream> {
    const dream: Dream = this.newDream();
    // Заполнить данные
    dream.title = "Полет над миром";
    // Вернуть подписку
    return of(dream);
  }
}