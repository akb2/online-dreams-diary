import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';
import { NavMenuType } from '@_models/nav-menu';





@Component({
  selector: 'app-profile-detail',
  templateUrl: './profile-detail.component.html',
  styleUrls: ['./profile-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileDetailComponent implements DoCheck {


  navMenuType: typeof NavMenuType = NavMenuType;

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  oldUser: User;
  public get user(): User {
    return AppComponent.user;
  };





  constructor(
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
    }
  }
}
