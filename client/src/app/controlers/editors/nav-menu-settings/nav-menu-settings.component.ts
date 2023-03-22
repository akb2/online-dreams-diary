import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { BackgroundImageDatas } from "@_datas/appearance";
import { BackgroundImageData } from "@_models/appearance";
import { MenuItem } from "@_models/menu";
import { NavMenuType } from "@_models/nav-menu";
import { MenuService } from "@_services/menu.service";
import { Subject, takeUntil } from "rxjs";





@Component({
  selector: "app-nav-menu-settings",
  templateUrl: "./nav-menu-settings.component.html",
  styleUrls: ["./nav-menu-settings.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MenuService]
})

export class NavMenuSettingsComponent implements OnInit, OnDestroy {


  @Input() backgroundId: number = 1;
  @Input() navMenuType: NavMenuType = NavMenuType.short;
  @Input() loader: boolean = false;
  @Input() diffBlockColor: boolean = true;

  @Input() mainTitle: string = "Заголовок";
  @Input() subTitle: string = "Подзаголовок";
  @Input() avatar: string;
  @Input() useAvatar: boolean = false;
  @Input() floatIcon: string;

  @Output() changeSettings: EventEmitter<NavMenuSettingData> = new EventEmitter<NavMenuSettingData>();

  imagePrefix: string = "../../../../assets/images/backgrounds/";

  menuItems: MenuItem[] = [];
  navMenuTypes: NavMenuType[] = Object.values(NavMenuType);
  _navMenuType: typeof NavMenuType = NavMenuType;
  backgroundImageDatas;

  private destroy$: Subject<void> = new Subject<void>();





  // Текущий фон
  get currentBackground(): BackgroundImageData {
    return this.backgroundImageDatas.find(b => b.id === this.backgroundId);
  }





  constructor(
    private menuService: MenuService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // Фоновые картинки
    this.backgroundImageDatas = BackgroundImageDatas.sort((b1, b2) => b1.id < b2.id ? 1 : b1.id > b2.id ? -1 : 0);
  }

  ngOnInit(): void {
    // Подписка на изменение меню
    this.menuService.menuItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(menuItems => {
        this.menuItems = menuItems;
        this.changeDetectorRef.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }





  // Изменение типа шапки
  onChangeType(navMenuType: NavMenuType): void {
    if (!this.loader && this.navMenuType !== navMenuType) {
      const backgroundId: number = this.backgroundId;
      this.navMenuType = navMenuType;
      // Вызов события
      this.changeSettings.emit({ backgroundId, navMenuType });
    }
  }

  // Изменение фона шапки
  onChangeBackground(backgroundId: number): void {
    if (!this.loader && this.backgroundId !== backgroundId) {
      const navMenuType: NavMenuType = this.navMenuType;
      this.backgroundId = backgroundId;
      // Вызов события
      this.changeSettings.emit({ backgroundId, navMenuType });
    }
  }
}





// Интерфейс выходных данных
export interface NavMenuSettingData {
  backgroundId: number;
  navMenuType: NavMenuType;
}
