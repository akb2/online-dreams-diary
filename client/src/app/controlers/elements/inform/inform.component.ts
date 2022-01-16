import { Component, Input, OnInit } from "@angular/core";





@Component({
  selector: "app-inform",
  templateUrl: "./inform.component.html",
  styleUrls: ["./inform.component.scss"]
})

export class InformComponent implements OnInit {


  @Input() public icon: string = "loader";
  @Input() public title: string;
  @Input() public subTitle: string;
  @Input() public description: string;





  ngOnInit() {
    this.icon = this.icon ? this.icon : "loader"
  }
}
