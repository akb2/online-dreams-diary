import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule } from "@angular/router";
import { AuthGuard } from "@_helpers/auth-guard";





@NgModule({
  imports: [RouterModule.forRoot(
    [
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
        data: { authRule: -1 },
        canActivate: [AuthGuard]
      },
      // Регистрация
      {
        path: "register",
        loadChildren: () => import("@_pages/register/register.module").then(m => m.RegisterModule),
        data: { authRule: -1 },
        canActivate: [AuthGuard]
      },
      // * Для авторизованных пользователей
      // Профиль: моя страница
      {
        path: "profile",
        loadChildren: () => import("@_pages/profile-detail/profile-detail.module").then(m => m.ProfileDetailModule),
        data: { authRule: 1, userId: -1 },
        canActivate: [AuthGuard]
      },
      // Настройки
      {
        path: "profile/settings",
        loadChildren: () => import("@_pages/profile-settings/profile-settings.module").then(m => m.ProfileSettingsModule),
        data: { authRule: 1 },
        canActivate: [AuthGuard]
      },
      // Настройки: Перснальные данные
      {
        path: "profile/settings/person",
        loadChildren: () => import("@_pages/profile-settings-person/profile-settings-person.module").then(m => m.ProfileSettingsPersonModule),
        data: { authRule: 1 },
        canActivate: [AuthGuard]
      },
      // Настройки: Персонализация
      {
        path: "profile/settings/appearance",
        loadChildren: () => import("@_pages/profile-settings-appearance/profile-settings-appearance.module").then(m => m.ProfileSettingsAppearanceModule),
        data: { authRule: 1 },
        canActivate: [AuthGuard]
      },
      // Настройки: Безопасность
      {
        path: "profile/settings/security",
        loadChildren: () => import("@_pages/profile-settings-security/profile-settings-security.module").then(m => m.ProfileSettingsSecurityModule),
        data: { authRule: 1 },
        canActivate: [AuthGuard]
      },
      // Дневник: Мои сновидения
      {
        path: "diary/my",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: -1, authRule: 1 },
        canActivate: [AuthGuard]
      },
      // Дневник: Редактор
      {
        path: "diary/editor",
        loadChildren: () => import("@_pages/diary-editor/diary-editor.module").then(m => m.DiaryEditorModule),
        data: { userId: 0, authRule: 1 },
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
      // Профиль: другие пользователи
      {
        path: "profile/:user_id",
        loadChildren: () => import("@_pages/profile-detail/profile-detail.module").then(m => m.ProfileDetailModule),
        data: { authRule: 0, userId: -2 },
        canActivate: [AuthGuard]
      },
      // Дневник
      {
        path: "diary",
        children: [],
        data: {
          authRule: 0,
          redirectAuth: "/diary/my",
          redirectNotAuth: "/diary/all",
        },
        canActivate: [AuthGuard]
      },
      // Дневник: Публичные сновидения
      {
        path: "diary/all",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: 0, authRule: 0 },
        canActivate: [AuthGuard]
      },
      // Дневник: Сновидения определенного пользователя
      {
        path: "diary/:user_id",
        loadChildren: () => import("@_pages/diary/diary.module").then(m => m.DiaryModule),
        data: { userId: -2, authRule: 0 },
        canActivate: [AuthGuard]
      },
      // Дневник: Просмотр
      {
        path: "diary/viewer",
        loadChildren: () => import("@_pages/diary-viewer/diary-viewer.module").then(m => m.DiaryViewerModule),
        data: { userId: 0, from: "", authRule: 0 },
        canActivate: [AuthGuard]
      },
      // Поиск: пользователи
      {
        path: "people",
        loadChildren: () => import("@_pages/people/people.module").then(m => m.PeopleModule),
        data: { authRule: 0 },
        canActivate: [AuthGuard]
      },
      // Ошибка 404
      {
        path: "**",
        loadChildren: () => import("@_pages/404/404.module").then(m => m.Page404Module),
        data: { authRule: 0 },
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
