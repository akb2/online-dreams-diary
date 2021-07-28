import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";





const routes: Routes = [
  // Главная страница
  {
    path: "cube",
    loadChildren: () => import("@_pages/cube/cube.module").then(m => m.CubeModule)
  },
  // Главная страница
  {
    path: "",
    loadChildren: () => import("@_pages/home/home.module").then(m => m.HomeModule)
  },
  // Авторизация
  {
    path: "auth",
    loadChildren: () => import("@_pages/auth/auth.module").then(m => m.AuthModule)
  },
  // Регистрация
  {
    path: "register",
    loadChildren: () => import("@_pages/register/register.module").then(m => m.RegisterModule)
  },
  // Ошибка 404
  {
    path: "**",
    loadChildren: () => import("@_pages/404/404.module").then(m => m.Page404Module)
  }
];





@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})






export class AppRoutingModule { }
