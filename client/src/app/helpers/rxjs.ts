import { Observable, map, mergeMap, of, skipWhile, take, takeWhile, timer } from "rxjs";
import { MathFloor } from "./math";





// Подписка ожидания условия
export const WaitObservable = (callback: () => boolean, limit: number = Infinity): Observable<void> => timer(0, 50).pipe(
  takeWhile(i => callback() && i < limit, true),
  skipWhile(i => callback() && i < limit),
  map(() => { })
);
