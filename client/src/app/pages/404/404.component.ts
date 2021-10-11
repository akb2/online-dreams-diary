import { Component } from "@angular/core";
import { BackgroundImageData, BackgroundImageDatas } from "@_models/appearance";





@Component({
  selector: "app-404",
  templateUrl: "./404.component.html",
  styleUrls: ["./404.component.scss"]
})





export class Page404Component {
  backgroundImageData: BackgroundImageData = BackgroundImageDatas.find(d => d.id === 2);
}
