import { Injectable, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { environment } from "@_environments/environment";





@Injectable({
  providedIn: "root"
})

export class CanonicalService {
  constructor(
    @Inject(DOCUMENT) private dom
  ) { }


  // Установить URL
  setURL(url: string = this.dom.URL) {
    let canURL: string = /^http(s)?/i.test(url) || /^(\/)?assets(s)?/i.test(url) ? url : environment.baseUrl + url;
    let link: HTMLLinkElement = document.querySelector("link[rel=canonical]");
    let linkExists: boolean = true;
    // URL
    url = url.replace(new RegExp("([^https?:\/\/]+)([\/]+)", "gi"), "$1/");
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
