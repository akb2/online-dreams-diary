import { Pipe, PipeTransform } from "@angular/core";
import { GetObjectValueByFields } from "@_datas/app";
import { User, UserSex } from "@_models/account";





@Pipe({ name: "notificationText" })

export class NotificationTextPipe implements PipeTransform {
  transform(text: string, data: NotificationTextInData): string {
    if (!!data.user) {
      data.user.sexLetter = data.user.sex === UserSex.Female ? "а" : "";
      // Параметры
      const patterns: string[] = ["\\$\{([a-z0-9\.\-_]+)\}", "\{\{([a-z0-9\.\-_]+)\}\}"];
      const keysRegExp: RegExp = new RegExp("(" + patterns.join("|") + ")", "gmi");
      const keys: string[] = text.match(keysRegExp);
      // Замена текста
      text = keys
        .map(key => ({
          original: key,
          key: patterns.reduce((o, p) => o.replace(new RegExp("^" + p + "$", "gmi"), "$1"), key)
        }))
        .reduce((o, { original, key }) => o.replace(original, GetObjectValueByFields(data, key).toString()), text);
    }
    // Вернуть текст
    return text;
  }
}





// Тип входных данных
interface NotificationTextInData {
  user?: Partial<NotificationUser>;
}

// Расширенный тип пользователя с постфиксом пола
interface NotificationUser extends User {
  sexLetter: string;
}
