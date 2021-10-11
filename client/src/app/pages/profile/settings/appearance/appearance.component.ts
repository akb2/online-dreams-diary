import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { User } from '@_models/account';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { AccountService } from '@_services/account.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';





@Component({
  selector: 'app-settings-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsAppearanceComponent {


  user: User;
  backgroundImageDatas: BackgroundImageData[] = BackgroundImageDatas;
  backgroundImageLoader: boolean = false;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.subscribeUser().subscribe(user => {
      this.user = user;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Изменить фон
  changeImage(profileBackground: BackgroundImageData): void {
    if (this.user.settings.profileBackground.id !== profileBackground.id) {
      this.backgroundImageLoader = true;
      this.accountService.saveUserSettings({ ...this.user.settings, profileBackground }).subscribe(
        code => {
          if (code === "0001") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          // Отключить загрузку
          this.hideLoader();
        },
        () => this.hideLoader()
      );
    }
  }





  // Подписка на пользователя
  private subscribeUser(): Observable<User> {
    return this.accountService.user$.pipe(takeUntil(this.destroy$));
  }

  // Отключить лоадер
  private hideLoader(): void {
    this.backgroundImageLoader = false;
    // Изменения
    this.changeDetectorRef.detectChanges();
  }
}