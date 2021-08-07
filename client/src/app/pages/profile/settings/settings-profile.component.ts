import { Component } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';





@Component({
  selector: 'app-home',
  templateUrl: './settings-profile.component.html',
  styleUrls: ['./settings-profile.component.scss']
})
export class SettingsProfileComponent {


  public get user(): User {
    return AppComponent.user;
  };
}
