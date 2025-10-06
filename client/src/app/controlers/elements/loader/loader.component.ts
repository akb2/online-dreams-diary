import { IconColor } from "@_models/app";
import { anyToInt, createArray } from "@akb2/types-tools";
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from "@angular/core";





@Component({
  selector: "app-loader",
  templateUrl: "./loader.component.html",
  styleUrls: ["./loader.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoaderComponent implements OnChanges {

  @Input() size: string | number = "120px";
  @Input() color: IconColor | "whiteColor" = "primary";

  leafCount: number[] = createArray(14);





  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes?.size) {
      if (changes.size.currentValue == anyToInt(changes.size.currentValue)) {
        this.size = this.size + "px";
      }
    }
  }
}
