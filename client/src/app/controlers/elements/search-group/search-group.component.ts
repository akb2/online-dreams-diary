import { ChangeDetectionStrategy, Component, Input } from "@angular/core";





@Component({
  selector: "search-group",
  templateUrl: "search-group.component.html",
  styleUrls: ["./search-group.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SearchGroupComponent {
  @Input() title: string;
}
