import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { ObjectToStringParams } from "@_datas/api";
import { environment } from "@_environments/environment";
import { ExcludeUrlObjectValues } from "@_models/api";
import { CustomObject } from "@_models/app";
import { GetBaseUrl } from "@_helpers/app";





@Injectable({
  providedIn: "root"
})

export class CanonicalService {
  constructor(
    @Inject(DOCUMENT) private dom
  ) { }


  // Установить URL
  setURL(url: string = this.dom.URL, params: CustomObject<any> = {}, excludeParams: ExcludeUrlObjectValues = {}) {
    let canURL: string = /^http(s)?/i.test(url) || /^(\/)?assets(s)?/i.test(url) ? url : GetBaseUrl() + url;
    let link: HTMLLinkElement = document.querySelector("link[rel=canonical]");
    let linkExists: boolean = true;
    // URL
    canURL = canURL.replace(new RegExp("^([http?:\/\/]+)([\/]+)", "gi"), "$1/");
    // Добавить параметры
    if (!!params) {
      const stringParams: string = ObjectToStringParams(params, "", excludeParams);
      const hasParams: boolean = (new RegExp("([\?])", "i")).test(stringParams);
      // Добавить параметры
      if (!!stringParams) {
        canURL = canURL + (hasParams ? "&" : "?") + stringParams;
      }
    }
    // Ссылки не существует
    if (!link) {
      link = this.dom.createElement("link");
      linkExists = false;
    }
    // Установить ссылку
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", canURL);
    // Добавить
    if (!linkExists) {
      this.dom.head.appendChild(link);
    }
  }
}
