import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { NotificationTypeDescriptions } from "@_datas/notification";
import { User, UserNotificationSetting, UserSettings } from "@_models/account";
import { NavMenuType } from "@_models/nav-menu";
import { NotificationActionType, NotificationTypeDescription } from "@_models/notification";
import { AccountService } from "@_services/account.service";
import { SnackbarService } from "@_services/snackbar.service";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "page-profile-settings-notifications",
  templateUrl: "./profile-settings-notifications.component.html",
  styleUrls: ["profile-settings-notifications.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class profileSettingsNotificationsComponent implements OnInit, OnDestroy {


  backgroundImageLoader: boolean = false;
  private saveSettingDelay: number = 500;
  navMenuType: typeof NavMenuType = NavMenuType;

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  form: FormGroup;
  loading: boolean = true;

  user: User;
  notificationTypeDescriptions: NotificationTypeDescription[] = NotificationTypeDescriptions;

  private destroyed$: Subject<void> = new Subject<void>();





  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private snackbarService: SnackbarService,
    private formBuilder: FormBuilder
  ) {
    // Форма настроек
    this.form = this.formBuilder.group(this.notificationTypeDescriptions.reduce((o, description) => ({
      ...o,
      // Значения для сайта
      [description.type + "-site"]: this.formBuilder.control({
        value: description.siteRequired ? true : false,
        disabled: description.siteRequired
      }),
      // Значения для почты
      [description.type + "-email"]: this.formBuilder.control({
        value: description.emailRequired ? true : false,
        disabled: description.emailRequired
      })
    }), {}));
  }

  ngOnInit(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => {
        this.user = user;
        this.loading = false;
        this.changeDetectorRef.detectChanges();
      });
    // Определить данные
    this.defineData();
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }





  // Сохранение настроек
  onSave(): void {
    if (!!this.user) {
      const userSettings: UserSettings = {
        ...this.user.settings,
        notifications: this.notificationTypeDescriptions.reduce((o, { type }) => ({
          ...o,
          [type]: {
            site: !!this.form?.get(type + "-site")?.value,
            email: !!this.form?.get(type + "-email")?.value,
          }
        } as UserNotificationSetting), {})
      };
      // Загрузчик
      this.loading = true;
      this.changeDetectorRef.detectChanges();
      // Сохранение
      this.accountService.saveUserSettings(userSettings)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.loading = false;
          // Уведомление
          this.snackbarService.open({
            mode: "success",
            message: "Настройки успешно сохранены"
          });
          // Обновить
          this.changeDetectorRef.detectChanges();
        });
    }
  }





  // Загрузка данных
  private defineData(): void {
    this.accountService.user$()
      .pipe(takeUntil(this.destroyed$))
      .subscribe(user => Object.entries(user.settings.notifications).forEach(([type, setting]) => {
        const baseSetting: NotificationTypeDescription = NotificationTypeDescriptions.find(description => (type as NotificationActionType) === description.type);
        const siteControl: FormControl = this.form?.get(type + "-site") as FormControl;
        const emailControl: FormControl = this.form?.get(type + "-email") as FormControl;
        // Базовые настройки обнаружены
        if (!!baseSetting && !!siteControl && !!emailControl) {
          siteControl.setValue(baseSetting.siteRequired ? true : setting.site);
          emailControl.setValue(baseSetting.emailRequired ? true : setting.email);
        }
        // Обновить
        this.changeDetectorRef.detectChanges();
      }));
  }
}
