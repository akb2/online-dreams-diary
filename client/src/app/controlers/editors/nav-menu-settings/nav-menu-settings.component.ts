import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";
import { MenuItem } from "@_models/menu";
import { NavMenuType } from "@_models/nav-menu";
import { MenuService } from "@_services/menu.service";





@Component({
  selector: "app-nav-menu-settings",
  templateUrl: "./nav-menu-settings.component.html",
  styleUrls: ["./nav-menu-settings.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class NavMenuSettingsComponent implements OnInit {


  @Input() backgroundId: number = 1;
  @Input() navMenuType: NavMenuType = NavMenuType.short;
  @Input() loader: boolean = false;
  @Input() diffBlockColor: boolean = true;

  @Input() title: string = "Заголовок";
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

  get currentBackground(): BackgroundImageData {
    return this.backgroundImageDatas.find(b => b.id === this.backgroundId);
  }





  constructor(
    private menuService: MenuService
  ) {
    // Фоновые картинки
    this.backgroundImageDatas = BackgroundImageDatas.sort((b1, b2) => b1.id < b2.id ? 1 : b1.id > b2.id ? -1 : 0);
  }

  ngOnInit(): void {
    this.menuService.createMenuItems();
    [this.menuItems] = [this.menuService.menuItems];
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
