import { Observable, map, mergeMap, of, skipWhile, take, takeWhile, timer } from "rxjs";
import { MathFloor } from "./math";





// Подписка ожидания условия
export const WaitObservable = (callback: () => boolean, limit: number = Infinity): Observable<void> => timer(0, 50).pipe(
  takeWhile(i => callback() && i < limit, true),
  skipWhile(i => callback() && i < limit),
  map(() => { })
);

// RXJS цикл
export const TakeCycle = (limit: number, grouping: number = 1): Observable<number> => timer(0, 1).pipe(
  take(MathFloor(limit / grouping)),
  mergeMap(n => {
    const group = Array(grouping).fill(null).map((_, i) => n * grouping + i).slice(0, limit - n * grouping);
    // Вернуть группу
    return of(...group);
  })
);
