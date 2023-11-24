import { environment } from "@_environments/environment";
import { AuthRules } from "@_models/menu";
import { AuthGuardService } from "@_services/auth-guard.service";
import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";





const devToolsRoutes: Routes = [];
// Заполнить страницы для разработчиков
if (!environment.production) {
  devToolsRoutes.push({
    path: "dev_tools/noise_generator",
    loadChildren: () => import("@_modules/dev-tools.module").then(m => m.DevToolsModule),
  });
}





@NgModule({
  providers: [
    AuthGuardService
  ],
  imports: [RouterModule.forRoot(
    [
      // * Для неавторизованных пользователей
      // Главная страница
      {
        path: "home",
        loadChildren: () => import("@_pages/home/home.module").then(m => m.HomeModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuardService]
      },
      // Авторизация
      {
        path: "auth",
        loadChildren: () => import("@_pages/auth/auth.module").then(m => m.AuthModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuardService]
      },
      // Регистрация
      {
        path: "register",
        loadChildren: () => import("@_pages/register/register.module").then(m => m.RegisterModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuardService]
      },
      // Активация аккаунта
      {
        path: "account-confirmation/:userId/:activationCode",
        loadChildren: () => import("@_pages/account-confirmation/account-confirmation.module").then(m => m.AccountConfirmationModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuardService]
      },
      // * Для авторизованных пользователей
      // Настройки
      {
        path: "profile/settings",
        loadChildren: () => import("@_pages/profile-settings/profile-settings.module").then(m => m.ProfileSettingsModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Настройки: Перснальные данные
      {
        path: "profile/settings/person",
        loadChildren: () => import("@_pages/profile-settings-person/profile-settings-person.module").then(m => m.ProfileSettingsPersonModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Настройки: Приватность
      {
        path: "profile/settings/notifications",
        loadChildren: () => import("@_pages/profile-settings-notifications/profile-settings-notifications.module").then(m => m.profileSettingsNotificationsModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Настройки: Приватность
      {
        path: "profile/settings/private",
        loadChildren: () => import("@_pages/profile-settings-private/profile-settings-private.module").then(m => m.ProfileSettingsPrivateModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Настройки: Персонализация
      {
        path: "profile/settings/appearance",
        loadChildren: () => import("@_pages/profile-settings-appearance/profile-settings-appearance.module").then(m => m.ProfileSettingsAppearanceModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Настройки: Безопасность
      {
        path: "profile/settings/security",
        loadChildren: () => import("@_pages/profile-settings-security/profile-settings-security.module").then(m => m.ProfileSettingsSecurityModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Дневник: Мои сновидения
      {
        path: "diary/my",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: -1, authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Дневник: Редактор: новый сон
      {
        path: "diary/editor",
        loadChildren: () => import("@_pages/diary-editor/diary-editor.module").then(m => m.DiaryEditorModule),
        data: { userId: 0, authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // Дневник: Редактор: редактирование сна
      {
        path: "diary/editor/:dreamId",
        loadChildren: () => import("@_pages/diary-editor/diary-editor.module").then(m => m.DiaryEditorModule),
        data: { userId: 0, authRule: AuthRules.auth },
        canActivate: [AuthGuardService]
      },
      // * Страницы, не имеющие значения авторизации
      // Главная страница
      {
        path: "",
        children: [],
        data: {
          authRule: AuthRules.anyWay,
          redirectAuth: "/profile/:userId",
          redirectNotAuth: "/home",
        },
        canActivate: [AuthGuardService]
      },
      // Профиль
      {
        path: "profile/:user_id",
        loadChildren: () => import("@_pages/profile-detail/profile-detail.module").then(m => m.ProfileDetailModule),
        data: { authRule: AuthRules.anyWay, userId: -1 },
        canActivate: [AuthGuardService]
      },
      // Дневник
      {
        path: "diary",
        children: [],
        data: {
          authRule: AuthRules.anyWay,
          redirectAuth: "/diary/my",
          redirectNotAuth: "/diary/all",
        },
        canActivate: [AuthGuardService]
      },
      // Дневник: Публичные сновидения
      {
        path: "diary/all",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: 0, authRule: AuthRules.anyWay },
        canActivate: [AuthGuardService]
      },
      // Дневник: Сновидения определенного пользователя
      {
        path: "diary/:user_id",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: -1, authRule: AuthRules.anyWay },
        canActivate: [AuthGuardService]
      },
      // Дневник: Просмотр
      {
        path: "diary/viewer/:dreamId",
        loadChildren: () => import("@_pages/diary-viewer/diary-viewer.module").then(m => m.DiaryViewerModule),
        data: { userId: 0, from: "", authRule: AuthRules.anyWay },
        canActivate: [AuthGuardService]
      },
      // Поиск
      {
        path: "search",
        loadChildren: () => import("@_pages/search/search.module").then(m => m.SearchModule),
        data: { authRule: AuthRules.anyWay },
        canActivate: [AuthGuardService]
      },
      // Поиск: пользователи
      {
        path: "people",
        loadChildren: () => import("@_pages/people/people.module").then(m => m.PeopleModule),
        data: { authRule: AuthRules.anyWay },
        canActivate: [AuthGuardService]
      },
      // Страницы для разработчиков
      ...devToolsRoutes,
      // Ошибка 404
      {
        path: "**",
        loadChildren: () => import("@_pages/404/404.module").then(m => m.Page404Module),
        data: { authRule: AuthRules.anyWay },
        canActivate: [AuthGuardService]
      },
    ],
    {
      preloadingStrategy: PreloadAllModules
    }
  )],
  exports: [RouterModule]
})

export class AppRoutingModule { }
