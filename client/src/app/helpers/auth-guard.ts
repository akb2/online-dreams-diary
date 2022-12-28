import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { User } from "@_models/account";
import { AuthRules } from "@_models/menu";
import { AccountService } from "@_services/account.service";
import { SnackbarService } from "@_services/snackbar.service";





@Injectable({ providedIn: "root" })

export class AuthGuard implements CanActivate {


  constructor(
    private router: Router,
    private accountService: AccountService,
    private snackBar: SnackbarService
  ) { }





  // Активатор
  public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const pageRule: AuthRules = parseFloat(route.data.authRule) as AuthRules || 0;
    const userAuth: boolean = this.accountService.checkAuth;
    const user: User = this.accountService.user.getValue();
    // Редирект пользователей
    if ((route.data?.redirectAuth?.length > 0 && userAuth) || (route.data?.redirectNotAuth?.length > 0 && !userAuth)) {
      // Редирект авторизованного пользователя
      if (route.data?.redirectAuth?.length > 0 && userAuth) {
        this.router.navigate([route.data?.redirectAuth.replace(":userId", user?.id ?? 0)], { state: { checkToken: false } });
      }
      // Редирект неавторизованного пользователя
      else {
        this.router.navigate([route.data?.redirectNotAuth], { state: { checkToken: false } });
      }
    }
    // Проверка авторизации
    else if ((pageRule == AuthRules.notAuth && !userAuth) || (pageRule == AuthRules.auth && userAuth) || pageRule == AuthRules.anyWay) {
      // Вернуть результат
      return true;
    }
    // Обработка запрета роута
    else {
      // Для авторизованного пользователя
      if (userAuth) {
        this.router.navigate(["/"]);
      }
      // Для неавторизованного пользователя
      else {
        // Открыть сообщение
        this.snackBar.open({
          message: "Для просмотра раздела требуется авторизация",
          mode: "error"
        });
        // Перенаправить
        this.router.navigate(["/"]);
      }
    }
    // Роут запрещен
    return false;
  }
}
