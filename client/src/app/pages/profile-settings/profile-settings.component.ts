import { ChangeDetectionStrategy } from '@angular/compiler';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@_models/account';
import { MenuItem } from '@_models/menu';
import { NavMenuType } from '@_models/nav-menu';
import { AccountService } from '@_services/account.service';
import { Subject, takeUntil } from 'rxjs';





@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ProfileSettingsComponent implements OnInit, OnDestroy {


  imagePrefix: string = "../../../../assets/images/backgrounds/";

  menuItems: MenuItem[] = MenuItems;
  navMenuType: NavMenuType = NavMenuType.collapse;

  user: User;

  private destroy$: Subject<void> = new Subject<void>();





  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.accountService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}





// Пункты меню
const MenuItems: MenuItem[] = [
  // Персональные данные
  {
    icon: "assignment_ind",
    text: "Персональные данные",
    desc: "Настройки всех личных персональных данных вашего аккаунта",
    link: "person"
  },
  // Приватность
  {
    icon: "vpn_lock",
    text: "Приватность",
    desc: "Настройка безопасности ваших персональных данных",
    link: "private"
  },
  // Персонализация
  {
    icon: "color_lens",
    text: "Персонализация",
    desc: "Настройка внешнего вида приложения",
    link: "appearance"
  },
  //Безопасность аккаунта
  {
    icon: "security",
    text: "Безопасность аккаунта",
    desc: "Просмотр всех активных сессий, изменение пароля",
    link: "security"
  }
]
