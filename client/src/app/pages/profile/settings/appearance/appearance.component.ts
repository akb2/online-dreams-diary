import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, OnDestroy } from '@angular/core';
import { AppComponent } from '@app/app.component';
import { User, UserSettings } from '@_models/account';
import { BackgroundImageData, BackgroundImageDatas } from '@_models/appearance';
import { MenuItem } from '@_models/menu';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { MenuService } from '@_services/menu.service';
import { ScreenService } from '@_services/screen.service';
import { Subject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';





@Component({
  selector: 'app-settings-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SettingsAppearanceComponent implements OnDestroy, DoCheck {


  backgroundImageDatas: BackgroundImageData[] = [];
  backgroundImageLoader: boolean = false;
  navMenuTypes: NavMenuType[] = Object.values(NavMenuType);
  navMenuType: typeof NavMenuType = NavMenuType;
  menuItems: MenuItem[] = [];

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
    private menuService: MenuService
  ) {
    // Пункты меню
    this.menuItems = this.menuService.menuItems;
    // Фоновые картинки
    this.backgroundImageDatas = BackgroundImageDatas.reverse();
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





  // Изменить фон
  changeImage(profileBackground: BackgroundImageData): void {
    if (this.user.settings.profileBackground.id !== profileBackground.id && !this.backgroundImageLoader) {
      this.saveUserSettings({ ...this.user.settings, profileBackground });
    }
  }

  // Изменить тип шапки
  changeHeaderType(profileHeaderType: NavMenuType): void {
    if (this.user.settings.profileHeaderType !== profileHeaderType && !this.backgroundImageLoader) {
      this.saveUserSettings({ ...this.user.settings, profileHeaderType });
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
    this.accountService.saveUserSettings(userSettings)
      .pipe(mergeMap(() => this.screenService.loadImage(this.imagePrefix + userSettings.profileBackground.imageName), data => data))
      .subscribe(
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