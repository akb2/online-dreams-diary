import { BrowserInfo } from "@_models/app";





// Информация о токене
export interface TokenInfo {
  id: number;
  token: string;
  createDate: Date;
  lastActionDate: Date;
  userId: number;
  ip: string;
  browser: BrowserInfo;
}