import { Component } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User } from '@_models/account';





@Component({
  selector: 'app-detail-profile',
  templateUrl: './detail-profile.component.html',
  styleUrls: ['./detail-profile.component.scss']
})
export class DetailProfileComponent {


  public get user(): User {
    return AppComponent.user;
  };
}
