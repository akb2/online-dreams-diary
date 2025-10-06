import { CurrentUserIdLocalStorageKey } from "@_datas/account";
import { anyToInt } from "@akb2/types-tools";
import { LocalStorageGet } from "./local-storage";

// Получить текущий токен
export const GetCurrentUserId = () => anyToInt(LocalStorageGet(CurrentUserIdLocalStorageKey));
