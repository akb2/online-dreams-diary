import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DreamMap } from '@_models/dream-map';
import { NavMenuType } from '@_models/nav-menu';
import { CanonicalService } from '@_services/canonical.service';
import { DreamService } from '@_services/dream.service';





@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class HomeComponent {


  navMenuType: NavMenuType = NavMenuType.full;
  dreamMap: DreamMap;





  constructor(
    private dreamService: DreamService,
    private canonicalService: CanonicalService
  ) {
    this.dreamMap = this.dreamService.dreamMapConverter(null);
    this.canonicalService.setURL("home");
  }
}
