import { Component } from '@angular/core';
import { User } from '@_models/account';
import { BrowserNames, OsNames, SimpleObject } from '@_models/app';
import { TokenInfo } from '@_models/token';
import { AccountService } from '@_services/account.service';
import { TokenService } from '@_services/token.service';
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
  public tokenInfo: TokenInfo;
  public osNames: SimpleObject = OsNames;
  public browserNames: SimpleObject = BrowserNames;

  public loadingTokenInfo: boolean = true;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private tokenService: TokenService
  ) {
    this.getToken();
    // Подписка на данные пользвателя
    this.subscribeUser().subscribe();
  }





  // Получить сведения о токене
  private getToken(): void {
    this.loadingTokenInfo = true;
    // Загрузка информации о токене
    this.tokenService.getToken().subscribe(tokenInfo => {
      this.loadingTokenInfo = false;
      this.tokenInfo = tokenInfo;
    });
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
