import { Component } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { NavMenuType } from '@_models/nav-menu';





@Component({
  selector: 'app-detail-profile',
  templateUrl: './detail-profile.component.html',
  styleUrls: ['./detail-profile.component.scss']
})
export class DetailProfileComponent {

  navMenuType: typeof NavMenuType = NavMenuType;

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  public get user(): User {
    return AppComponent.user;
  };
}
