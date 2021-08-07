import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AuthGuard } from "@_helpers/auth-guard";





const routes: Routes = [
  // ! Информация о ключе authRule см. в типе AuthRules файла menu.ts в моделях
  // * Для неавторизованных пользователей
  // Главная страница
  {
    path: "home",
    loadChildren: () => import("@_pages/home/home.module").then(m => m.HomeModule),
    data: { authRule: -1 },
    canActivate: [AuthGuard]
  },
  // Авторизация
  {
    path: "auth",
    loadChildren: () => import("@_pages/auth/auth.module").then(m => m.AuthModule),
    data: { title: "Авторизация", authRule: -1 },
    canActivate: [AuthGuard]
  },
  // Регистрация
  {
    path: "register",
    loadChildren: () => import("@_pages/register/register.module").then(m => m.RegisterModule),
    data: { title: "Регистрация", authRule: -1 },
    canActivate: [AuthGuard]
  },
  // * Для авторизованных пользователей
  // Личный кабинет
  {
    path: "profile",
    loadChildren: () => import("@_pages/profile/profile.module").then(m => m.ProfileModule),
    data: { title: "Кабинет сновидца", authRule: 1 },
    canActivate: [AuthGuard]
  },
  // * Страницы, не имеющие значения авторизации
  // Главная страница
  {
    path: "",
    children: [],
    data: {
      authRule: 0,
      redirectAuth: "/profile",
      redirectNotAuth: "/home",
    },
    canActivate: [AuthGuard]
  },
  // Ошибка 404
  {
    path: "**",
    loadChildren: () => import("@_pages/404/404.module").then(m => m.Page404Module),
    data: { title: "Ошибка 404", authRule: 0 },
    canActivate: [AuthGuard]
  },
];





@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})






export class AppRoutingModule { }
