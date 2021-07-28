import { Component } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';





@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ["./app.component.scss"]
})





export class AppComponent {


  public title: string = 'app';

  public showPreloader: boolean = true;
  private loaderDelay: number = 150;





  // Конструктор
  constructor(
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.beforeLoadPage();
      }

      else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.afterLoadPage();
      }
    });
  }





  // Действия перед загрузкой страницы
  private beforeLoadPage(): void {
    this.showPreloader = true;
    document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
  }

  // Действия после загрузки страницы
  private afterLoadPage(): void {
    setTimeout(timer => {
      this.showPreloader = false;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    }, this.loaderDelay);
  }
}
