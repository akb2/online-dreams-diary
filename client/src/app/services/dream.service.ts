import { Injectable } from "@angular/core";
import { User } from "@_models/account";
import { BackgroundImageDatas } from "@_models/appearance";
import { Dream, DreamMode } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { AccountService } from "@_services/account.service";





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





  newDream(): Dream {
    return {
      id: 0,
      user: this.currentUser,
      createDate: null,
      date: null,
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
}