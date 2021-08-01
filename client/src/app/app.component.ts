import { Component } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { AccountService } from '@_services/account.service';
import { ApiService } from '@_services/api.service';
import { SnackbarService } from '@_services/snackbar.service';





@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ["./app.component.scss"]
})





export class AppComponent {


  public title: string = 'app';

  public showPreloader: boolean = true;
  public validToken: boolean = false;
  private loaderDelay: number = 150;





  // Конструктор
  constructor(
    private router: Router,
    private accountService: AccountService,
    private snackBar: SnackbarService,
    private apiService: ApiService
  ) {
    // Пользователь авторизован, проверить токен
    if (this.accountService.checkAuth) {
      this.accountService.checkToken(["9014", "9015", "9016"]).subscribe(code => {
        // Если токен валидный
        if (code == "0001") {
          this.validToken = true;
        }
        // Токен не валидный
        else {
          this.router.navigate([""]);
          this.accountService.deleteAuth();
          // Сообщение с ошибкой
          this.snackBar.open({
            "mode": "error",
            "message": this.apiService.getMessageByCode(code)
          });
        }
      });
    }
    // Пользователь неавторизован
    else {
      this.validToken = true;
    }
    // События старта и окочания лоадера
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
    const showPreloader: boolean = !(this.router.getCurrentNavigation()?.extras.state?.showPreLoader == false);
    if (showPreloader) {
      this.showPreloader = true;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.add("no-scroll"));
    }
  }

  // Действия после загрузки страницы
  private afterLoadPage(): void {
    setTimeout(timer => {
      this.showPreloader = false;
      document.querySelectorAll("body, html").forEach(elm => elm.classList.remove("no-scroll"));
    }, this.loaderDelay);
  }
}
