import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { NavMenuSettingData } from '@_controlers/nav-menu-settings/nav-menu-settings.component';
import { User, UserSettings } from '@_models/account';
import { BackgroundImageDatas } from '@_models/appearance';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { ScreenService } from '@_services/screen.service';
import { SnackbarService } from '@_services/snackbar.service';
import { forkJoin, of, Subject } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';





@Component({
  selector: 'app-profile-settings-appearance',
  templateUrl: './profile-settings-appearance.component.html',
  styleUrls: ['./profile-settings-appearance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsAppearanceComponent implements OnDestroy, DoCheck {


  backgroundImageLoader: boolean = false;
  private saveSettingDelay: number = 500;
  navMenuType: typeof NavMenuType = NavMenuType;

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  private destroy$: Subject<void> = new Subject<void>();

  oldUser: User;
  public get user(): User {
    return AppComponent.user;
  };





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private snackbarService: SnackbarService
  ) {
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngDoCheck() {
    if (this.oldUser != this.user) {
      this.oldUser = this.user;
      this.changeDetectorRef.detectChanges();
    }
  }





  // Изменить настройки
  changeSettings(settings: NavMenuSettingData): void {
    if (!this.backgroundImageLoader) {
      if (this.user.settings.profileBackground.id !== settings.backgroundId || this.user.settings.profileHeaderType !== settings.navMenuType) {
        this.saveUserSettings({
          profileBackground: BackgroundImageDatas.find(b => b.id === settings.backgroundId),
          profileHeaderType: settings.navMenuType
        });
      }
    }
  }





  // Отключить лоадер
  private hideLoader(): void {
    this.backgroundImageLoader = false;
    // Изменения
    this.changeDetectorRef.detectChanges();
  }

  // Сохранить настройки
  private saveUserSettings(userSettings: UserSettings): void {
    this.backgroundImageLoader = true;
    // Запрос
    forkJoin([this.accountService.saveUserSettings(userSettings), of(true).pipe(delay(this.saveSettingDelay))])
      .pipe(mergeMap(() => this.screenService.loadImage(this.imagePrefix + userSettings.profileBackground.imageName), data => data))
      .subscribe(
        ([code]) => {
          if (code === "0001") {
            //window.scrollTo({ top: 0, behavior: "smooth" });
            this.snackbarService.open({
              mode: "success",
              message: "Настройки сохранены"
            });
          }
          // Отключить загрузку
          this.hideLoader();
        },
        () => this.hideLoader()
      );
  }
}