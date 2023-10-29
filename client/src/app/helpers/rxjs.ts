import { CreateArray } from "@_datas/app";
import { Observable, map, mergeMap, of, skipWhile, take, takeWhile, timer } from "rxjs";
import { CheckInRange, MathCeil } from "./math";





// Подписка ожидания условия
export const WaitObservable = (callback: () => boolean, limit: number = Infinity): Observable<void> => timer(0, 50).pipe(
  takeWhile(i => callback() && i < limit, true),
  skipWhile(i => callback() && i < limit),
  map(() => { })
);

// RXJS цикл
export const TakeCycle = (limit: number, grouping: number = 1): Observable<number> => timer(0, 1).pipe(
  take(MathCeil(limit / grouping)),
  mergeMap(n => {
    const before: number = n * grouping;
    const length: number = CheckInRange(grouping, limit - before);
    const group: number[] = CreateArray(length).map(i => before + i);
    // Вернуть группу
    return of(...group);
  })
);
