import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { Dream } from "@_models/dream";
import { NavMenuType } from "@_models/nav-menu";
import { DreamDescription, DreamTitle } from "@_services/dream.service";





@Component({
  selector: "app-dream-list",
  templateUrl: "./dream-list.component.html",
  styleUrls: ["./dream-list.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class DreamListComponent {


  @Input() dreams: Dream[];

  defaultTitle: string = DreamTitle;
  defaultDescription: string = DreamDescription;
  today: Date = new Date();
  imagePrefix: string = "../../../../assets/images/backgrounds/";





  // Без картинки
  isHasImage(dream: Dream): boolean {
    return dream.headerType === NavMenuType.full || dream.headerType === NavMenuType.short;
  }
}
