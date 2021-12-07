import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavMenuType } from '@_models/nav-menu';





@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class HomeComponent {


  public cycle: number[] = Array(70).fill(0);
  public testText: string = "123";

  navMenuType: NavMenuType = NavMenuType.full;





  // Тест
  public test(text: string): void {
  }
}
