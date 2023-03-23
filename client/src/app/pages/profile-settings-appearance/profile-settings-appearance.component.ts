import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavMenuSettingData } from '@_controlers/nav-menu-settings/nav-menu-settings.component';
import { BackgroundImageDatas } from '@_datas/appearance';
import { User, UserSettings } from '@_models/account';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { ScreenService } from '@_services/screen.service';
import { SnackbarService } from '@_services/snackbar.service';
import { forkJoin, of, Subject } from 'rxjs';
import { delay, mergeMap, takeUntil } from 'rxjs/operators';





@Component({
  selector: 'app-profile-settings-appearance',
  templateUrl: './profile-settings-appearance.component.html',
  styleUrls: ['./profile-settings-appearance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsAppearanceComponent implements OnInit, OnDestroy {


  backgroundImageLoader: boolean = false;
  private saveSettingDelay: number = 500;
  navMenuType: typeof NavMenuType = NavMenuType;

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  user: User;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private screenService: ScreenService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.changeDetectorRef.detectChanges();
      })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Изменить настройки
  changeSettings(settings: NavMenuSettingData): void {
    if (!this.backgroundImageLoader) {
      if (
        this.user.settings.profileBackground.id !== settings.backgroundId ||
        this.user.settings.profileHeaderType !== settings.navMenuType
      ) {
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
      .pipe(
        takeUntil(this.destroy$),
        mergeMap(
          () => this.screenService.loadImage(this.imagePrefix + userSettings.profileBackground.imageName),
          data => data
        )
      )
      .subscribe(
        ([code]) => {
          if (code === "0001") {
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
