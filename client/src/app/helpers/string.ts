import { CreateArray } from "@_datas/app";
import { Random } from "./math";





// Генерация уникального ID
export const CreateRandomID = (length: number) => {
  const characters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength: number = characters.length;
  // Генерация
  return CreateArray(length)
    .map(() => characters.charAt(Math.floor(Math.random() * charactersLength)))
    .map(letter => !!Random(0, 1) ? letter.toLowerCase() : letter)
    .join("");
}
