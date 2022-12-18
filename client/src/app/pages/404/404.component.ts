import { ChangeDetectionStrategy, Component } from "@angular/core";
import { BackgroundImageData } from "@_models/appearance";
import { BackgroundImageDatas } from "@_datas/appearance";
import { NavMenuType } from "@_models/nav-menu";





@Component({
  selector: "app-404",
  templateUrl: "./404.component.html",
  styleUrls: ["./404.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class Page404Component {
  navMenuType: NavMenuType = NavMenuType.full;
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 2)!;
}
