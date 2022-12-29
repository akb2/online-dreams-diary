import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule } from "@angular/router";
import { AuthGuard } from "@_helpers/auth-guard";
import { AuthRules } from "@_models/menu";





@NgModule({
  imports: [RouterModule.forRoot(
    [
      // * Для неавторизованных пользователей
      // Главная страница
      {
        path: "home",
        loadChildren: () => import("@_pages/home/home.module").then(m => m.HomeModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuard]
      },
      // Авторизация
      {
        path: "auth",
        loadChildren: () => import("@_pages/auth/auth.module").then(m => m.AuthModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuard]
      },
      // Регистрация
      {
        path: "register",
        loadChildren: () => import("@_pages/register/register.module").then(m => m.RegisterModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuard]
      },
      // Активация аккаунта
      {
        path: "account-confirmation/:userId/:activationCode",
        loadChildren: () => import("@_pages/account-confirmation/account-confirmation.module").then(m => m.AccountConfirmationModule),
        data: { authRule: AuthRules.notAuth },
        canActivate: [AuthGuard]
      },
      // * Для авторизованных пользователей
      // Настройки
      {
        path: "profile/settings",
        loadChildren: () => import("@_pages/profile-settings/profile-settings.module").then(m => m.ProfileSettingsModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Настройки: Перснальные данные
      {
        path: "profile/settings/person",
        loadChildren: () => import("@_pages/profile-settings-person/profile-settings-person.module").then(m => m.ProfileSettingsPersonModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Настройки: Приватность
      {
        path: "profile/settings/private",
        loadChildren: () => import("@_pages/profile-settings-private/profile-settings-private.module").then(m => m.ProfileSettingsPrivateModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Настройки: Персонализация
      {
        path: "profile/settings/appearance",
        loadChildren: () => import("@_pages/profile-settings-appearance/profile-settings-appearance.module").then(m => m.ProfileSettingsAppearanceModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Настройки: Безопасность
      {
        path: "profile/settings/security",
        loadChildren: () => import("@_pages/profile-settings-security/profile-settings-security.module").then(m => m.ProfileSettingsSecurityModule),
        data: { authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Дневник: Мои сновидения
      {
        path: "diary/my",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: -1, authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Дневник: Редактор: новый сон
      {
        path: "diary/editor",
        loadChildren: () => import("@_pages/diary-editor/diary-editor.module").then(m => m.DiaryEditorModule),
        data: { userId: 0, authRule: AuthRules.auth },
        canActivate: [AuthGuard]
      },
      // Дневник: Редактор: редактирование сна
      {
        path: "diary/editor/:dreamId",
        loadChildren: () => import("@_pages/diary-editor/diary-editor.module").then(m => m.DiaryEditorModule),
        data: { userId: 0, authRule: AuthRules.auth },
        canActivate: [AuthGuard]
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
        canActivate: [AuthGuard]
      },
      // Профиль: другие пользователи
      {
        path: "profile/:user_id",
        loadChildren: () => import("@_pages/profile-detail/profile-detail.module").then(m => m.ProfileDetailModule),
        data: { authRule: AuthRules.anyWay, userId: -1 },
        canActivate: [AuthGuard]
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
        canActivate: [AuthGuard]
      },
      // Дневник: Публичные сновидения
      {
        path: "diary/all",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: 0, authRule: AuthRules.anyWay },
        canActivate: [AuthGuard]
      },
      // Дневник: Сновидения определенного пользователя
      {
        path: "diary/:user_id",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: -2, authRule: AuthRules.anyWay },
        canActivate: [AuthGuard]
      },
      // Дневник: Просмотр
      {
        path: "diary/viewer",
        loadChildren: () => import("@_pages/diary-viewer/diary-viewer.module").then(m => m.DiaryViewerModule),
        data: { userId: 0, from: "", authRule: AuthRules.anyWay },
        canActivate: [AuthGuard]
      },
      // Дневник: Просмотр
      {
        path: "diary/viewer/:dreamId",
        loadChildren: () => import("@_pages/diary-viewer/diary-viewer.module").then(m => m.DiaryViewerModule),
        data: { userId: 0, from: "", authRule: AuthRules.anyWay },
        canActivate: [AuthGuard]
      },
      // Поиск: пользователи
      {
        path: "people",
        loadChildren: () => import("@_pages/people/people.module").then(m => m.PeopleModule),
        data: { authRule: AuthRules.anyWay },
        canActivate: [AuthGuard]
      },
      // Ошибка 404
      {
        path: "**",
        loadChildren: () => import("@_pages/404/404.module").then(m => m.Page404Module),
        data: { authRule: AuthRules.anyWay },
        canActivate: [AuthGuard]
      },
    ],
    {
      preloadingStrategy: PreloadAllModules,
      relativeLinkResolution: "legacy"
    }
  )],
  exports: [RouterModule]
})

export class AppRoutingModule { }
