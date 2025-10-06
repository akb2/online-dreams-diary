import { AuthRules } from "@_models/menu";
import { AccountService } from "@_services/account.service";
import { GlobalService } from "@_services/global.service";
import { SnackbarService } from "@_services/snackbar.service";
import { anyToInt } from "@akb2/types-tools";
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { Observable, map } from "rxjs";





@Injectable()

export class AuthGuardService implements CanActivate {

  constructor(
    private router: Router,
    private accountService: AccountService,
    private snackBar: SnackbarService,
    private globalService: GlobalService
  ) { }





  // Активатор
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.globalService.init().pipe(
      map(user => {
        const redirectAuth: string = route.data?.redirectAuth;
        const redirectNotAuth: string = route.data?.redirectNotAuth;
        const pageRule: AuthRules = anyToInt(route.data.authRule, AuthRules.anyWay) as AuthRules;
        const userAuth: boolean = this.accountService.checkAuth;
        // Редирект пользователей
        if ((!!redirectAuth && userAuth) || (!!redirectNotAuth && !userAuth)) {
          const redirectUrl: string = !!redirectAuth && userAuth
            ? redirectAuth.replace(":userId", user.id?.toString())
            : redirectNotAuth;
          // Редирект
          this.router.navigate([redirectUrl], { state: { checkToken: false } });
        }
        // Проверка авторизации
        else if ((pageRule === AuthRules.notAuth && !userAuth) || (pageRule === AuthRules.auth && userAuth) || pageRule === AuthRules.anyWay) {
          return true;
        }
        // Для авторизованного пользователя
        else if (userAuth) {
          this.router.navigate(["/"]);
        }
        // Для неавторизованного пользователя
        else {
          this.snackBar.open({
            message: "Для просмотра раздела требуется авторизация",
            mode: "error"
          });
          // Перенаправить
          this.router.navigate(["/"]);
        }
        // Роут запрещен
        return true;
      })
    );
  }
}
