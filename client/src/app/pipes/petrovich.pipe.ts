import { User, UserSex } from "@_models/account";
import { CustomObjectKey } from "@akb2/types-tools";
import { Pipe, PipeTransform } from "@angular/core";
import * as petrovich from "petrovich";





@Pipe({ name: "petrovich" })

export class PetrovichPipe implements PipeTransform {
  transform(user: User, params: Decline | [Decline, petrovich.NameKey] = [2, "first"]): string {
    const decline: petrovich.DeclineKey = Declines[((Array.isArray(params) ? params[0] : params) ?? 1) - 1] ?? Declines[0];
    const sex: petrovich.NameSex = this.detectSex(user.sex ?? UserSex.UnDetected);
    const nameKey: petrovich.NameKey = Array.isArray(params) ? params[1] : "first";
    const value: string = nameKey === "first" ? user.name : (nameKey === "last" ? user.lastName : user.patronymic);
    // Поиск значения
    return petrovich?.[sex]?.[nameKey]?.[decline](value) ?? value;
  }

  // Определить пол
  private detectSex(value: string | UserSex): petrovich.NameSex {
    const sexes: CustomObjectKey<petrovich.NameSex, UserSex> = { male: UserSex.Male, female: UserSex.Female };
    const nameSexes: CustomObjectKey<UserSex, petrovich.NameSex> = { [UserSex.Male]: "male", [UserSex.Female]: "female" };
    const sex: UserSex = typeof value === "string" ? (sexes[petrovich.detect_gender(value)] ?? UserSex.UnDetected) : value;
    // Вернуть пол
    return nameSexes[sex] ?? "androgynous";
  }
}





// Тип падежа
type Decline = 1 | 2 | 3 | 4 | 5 | 6;

// Список ключей падежей
const Declines: petrovich.DeclineKey[] = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "instrumental",
  "prepositional"
];
