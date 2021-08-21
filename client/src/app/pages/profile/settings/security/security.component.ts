import { Component } from '@angular/core';
import { User } from '@_models/account';
import { AccountService } from '@_services/account.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';





// Декоратор компонента
@Component({
  selector: 'app-settings-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})

// Основной класс
export class SettingsSecurityComponent {


  public user: User;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private accountService: AccountService
  ) {
    // Подписка на данные пользвателя
    this.subscribeUser().subscribe();
  }





  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      map(user => {
        this.user = user;
        // Вернуть юзера
        return user;
      })
    );
  }
}
