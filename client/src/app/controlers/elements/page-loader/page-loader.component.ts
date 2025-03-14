import { CreateArray } from "@_datas/app";
import { ChangeDetectionStrategy, Component } from "@angular/core";





@Component({
  selector: "app-page-loader",
  templateUrl: "./page-loader.component.html",
  styleUrls: ["./page-loader.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PageLoaderComponent {
  leafCount: number[] = CreateArray(14);
}
