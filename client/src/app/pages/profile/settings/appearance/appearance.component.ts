import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { User } from '@_models/account';
import { TokenInfo } from '@_models/token';
import { AccountService } from '@_services/account.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';





@Component({
  selector: 'app-settings-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsAppearanceComponent {


  public user: User;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscribeUser().subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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





// Интерфейс данных токенов
interface LoadingTokenInfo extends TokenInfo {
  loading: boolean;
}