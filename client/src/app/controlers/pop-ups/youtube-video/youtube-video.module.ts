import { NgModule } from "@angular/core";
import { PopupYoutubeVideoComponent } from "./youtube-video.component";
import { CommonModule } from "@angular/common";

@NgModule({
  declarations: [
    PopupYoutubeVideoComponent
  ],
  exports: [
    PopupYoutubeVideoComponent
  ],
  imports: [
    CommonModule
  ]
})
export class PopupYoutubeVideoModule { }
