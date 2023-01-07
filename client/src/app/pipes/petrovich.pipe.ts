import { Pipe, PipeTransform } from "@angular/core";
import { User, UserSex } from "@_models/account";
import { CustomObjectKey } from "@_models/app";
import * as petrovich from "petrovich";





@Pipe({ name: "petrovich" })

export class PetrovichPipe implements PipeTransform {
  transform(user: User, params: Decline | [Decline, NameKey] = [2, "first"]): string {
    const decline: DeclineKey = Declines[((Array.isArray(params) ? params[0] : params) ?? 1) - 1] ?? Declines[0];
    const sex: PetrovichSex = this.detectSex(user.sex ?? UserSex.UnDetected);
    const nameKey: NameKey = Array.isArray(params) ? params[1] : "first";
    const value: string = nameKey === "first" ? user.name : (nameKey === "last" ? user.lastName : user.patronymic);
    // Поиск значения
    if (petrovich.hasOwnProperty(sex)) {
      if (petrovich[sex].hasOwnProperty(nameKey)) {
        if (petrovich[sex][nameKey].hasOwnProperty(decline)) {
          return petrovich[sex][nameKey][decline](value) ?? value;
        }
      }
    }
    // Вернуть неизменное значение
    return value;
  }

  // Определить пол
  private detectSex(value: string | UserSex): PetrovichSex {
    const sexes: CustomObjectKey<PetrovichSex, UserSex> = { "male": UserSex.Male, "female": UserSex.Female };
    const petrovichSexes: CustomObjectKey<UserSex, PetrovichSex> = { [UserSex.Male]: "male", [UserSex.Female]: "female" };
    const sex: UserSex = typeof value === "string" ? (sexes[petrovich.detect_gender(value)] ?? UserSex.UnDetected) : value;
    // Вернуть пол
    return petrovichSexes[sex] ?? "androgynous";
  }
}





// Тип падежа
type Decline = 1 | 2 | 3 | 4 | 5 | 6;

// Модель пола
type PetrovichSex = "male" | "female" | "androgynous";

// Ключи типов слов
type NameKey = "first" | "middle" | "last";

// Перечисление падежей
type DeclineKey = "nominative" | "genitive" | "dative" | "accusative" | "instrumental" | "prepositional";

// Список ключей падежей
const Declines: DeclineKey[] = ["nominative", "genitive", "dative", "accusative", "instrumental", "prepositional"];
