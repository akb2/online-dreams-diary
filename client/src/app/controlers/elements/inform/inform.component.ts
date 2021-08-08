import { Component, Input } from "@angular/core";





@Component({
  selector: "app-inform",
  templateUrl: "./inform.component.html",
  styleUrls: ["./inform.component.scss"]
})
export class InformComponent {
  @Input() public icon: string = "loader";
  @Input() public title: string;
  @Input() public subTitle: string;
  @Input() public description: string;
}
