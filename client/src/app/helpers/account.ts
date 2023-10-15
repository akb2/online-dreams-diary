import { CurrentUserIdLocalStorageKey } from "@_datas/account";
import { LocalStorageGet } from "./local-storage";
import { ParseInt } from "./math";





// Получить текущий токен
export const GetCurrentUserId = () => ParseInt(LocalStorageGet(CurrentUserIdLocalStorageKey));
