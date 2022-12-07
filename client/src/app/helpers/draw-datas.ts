import { DrawInterface } from "@_models/nav-menu";





// Класс с параметрами
export class DrawDatas {
  public static type: "full" | "short" | "collapse" = "collapse";
  public static minHeight: number = 60;
  public static screenWidth: number = 0;
  public static screenHeight: number = 0;
  public static containerWidth: number = 0;
  public static containerLeftWidth: number = 0;

  public static menu: DrawInterface[];
  public static menuList: DrawInterface[];
  public static menuSubList: DrawInterface[];
  public static menuSubListDecorator: DrawInterface[];
  public static menuListWithFloatingButton: DrawInterface[];
  public static menuItem: DrawInterface[];
  public static menuItemLine: DrawInterface[];
  public static menuSubItem: DrawInterface[];
  public static menuSubItemLast: DrawInterface[];
  public static menuSubItemLine: DrawInterface[];
  public static menuSubItemSeparator: DrawInterface[];
  public static helper: DrawInterface[];
  public static helperWithFloatingButton: DrawInterface[];
  public static header: DrawInterface[];
  public static scroll: DrawInterface[];
  public static title: DrawInterface[];
  public static titleWithBackButton: DrawInterface[];
  public static titleWithBackButtonAndAvatar: DrawInterface[];
  public static titleWithAvatar: DrawInterface[];
  public static subtitle: DrawInterface[];
  public static subtitleWithBackButton: DrawInterface[];
  public static subtitleWithBackButtonAndAvatar: DrawInterface[];
  public static subtitleWithAvatar: DrawInterface[];
  public static image: DrawInterface[];
  public static avatar: DrawInterface[];
  public static avatarWithBackButton: DrawInterface[];
  public static floatingButton: DrawInterface[];
  public static floatingButtonOverlay: DrawInterface[];
  public static backButton: DrawInterface[];
  public static toContentButton: DrawInterface[];





  // Высота короткой шапки
  private static get shortHeight(): number {
    if (DrawDatas.screenWidth < 900) {
      return 240;
    }
    // Для средних экранов
    if (DrawDatas.screenWidth < 1200) {
      return 320;
    }
    // По умолчанию
    return 440;
  }

  // Допустимая максимальная высота шапки
  static get maxHeight(): number {
    if (DrawDatas.type === "full") {
      return DrawDatas.screenHeight;
    }

    else if (DrawDatas.type === "short") {
      return DrawDatas.screenHeight > DrawDatas.shortHeight ? DrawDatas.shortHeight : DrawDatas.screenHeight;
    }

    return DrawDatas.minHeight;
  }

  // Количество линий для подзаголовка
  static get getSubTitleLines(): number {
    if (DrawDatas.type === "full") {
      return 6;
    }

    else if (DrawDatas.type === "short") {
      return 3;
    }

    return 1;
  }





  // Заполнение данных
  public static dataRender(): void {
    DrawDatas.menu = [{
      property: "height",
      data: {
        default: { min: DrawDatas.minHeight, max: DrawDatas.maxHeight, unit: "px" }
      }
    }];

    DrawDatas.menuList = [{
      property: "right",
      data: {
        default: { min: -75, max: -75, unit: "px" }
      }
    }];
    DrawDatas.menuListWithFloatingButton = [{
      property: "right",
      data: {
        default: { min: 0, max: -75, unit: "px" }
      }
    }];
    DrawDatas.menuItem = [{
      property: "font-size",
      data: {
        default: { min: 13, max: 18, unit: "px" },
        middle: { min: 13, max: 16, unit: "px" },
        large: { min: 13, max: 16, unit: "px" }
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 60, max: 60, unit: "px" },
        middle: { min: 40, max: 60, unit: "px" },
        large: { min: 40, max: 60, unit: "px" }
      }
    }, {
      property: "margin-top",
      data: {
        default: { min: 0, max: 15, unit: "px" },
        middle: { min: 10, max: 15, unit: "px" },
        large: { min: 10, max: 15, unit: "px" }
      }
    }, {
      property: ["padding-left", "padding-right"],
      data: {
        default: { min: 20, max: 32, unit: "px" },
        middle: { min: 16, max: 10, unit: "px" },
        large: { min: 16, max: 16, unit: "px" }
      }
    }];
    DrawDatas.menuItemLine = [{
      property: "height",
      data: {
        default: { min: 60, max: 3, unit: "px" },
        middle: { min: 40, max: 2, unit: "px" },
        large: { min: 40, max: 2, unit: "px" }
      }
    }];

    DrawDatas.menuSubList = [{
      property: "background-color",
      data: {
        default: { min: [49, 65, 165, 1], max: [0, 0, 0, 0.8], prefixUnit: "rgba(", sufixUnit: ")", separatorUnit: ", " }
      }
    }, {
      property: "border-width",
      data: {
        default: { min: [1, 0, 0, 0], max: [0, 1, 1, 1], separatorUnit: " ", unit: "px" }
      }
    }, {
      property: "border-color",
      data: {
        default: { min: [92, 108, 192, 1], max: [255, 255, 255, 1], separatorUnit: ", ", prefixUnit: "rgba(", sufixUnit: ")" }
      }
    }, {
      property: "border-radius",
      data: {
        default: { min: [0, 0, 0, 0], max: [0, 0, 5, 5], unit: "px", separatorUnit: " " }
      }
    }];
    DrawDatas.menuSubListDecorator = [{
      property: "width",
      data: {
        default: { min: 0, max: 60, unit: "px", prefixUnit: "calc(100% + ", sufixUnit: ")" }
      }
    }, {
      property: "height",
      data: {
        default: { min: 0, max: 1, unit: "px" }
      }
    }, {
      property: "left",
      data: {
        default: { min: 0, max: -30, unit: "px" }
      }
    }];
    DrawDatas.menuSubItem = [{
      property: ["padding-left", "padding-right"],
      data: {
        default: { min: 26, max: 38, unit: "px" }
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 44, max: 56, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 14, max: 17, unit: "px" }
      }
    }];
    DrawDatas.menuSubItemLast = [...DrawDatas.menuSubItem];
    DrawDatas.menuSubItemLast.push({
      property: "border-radius",
      data: {
        default: { min: [0, 0, 0, 0], max: [0, 0, 5, 5], unit: "px", separatorUnit: " " }
      }
    });
    DrawDatas.menuSubItemLine = [{
      property: "width",
      data: {
        default: { min: [100, 0], max: [0, 5], unit: ["%", "px"], separatorUnit: " + ", prefixUnit: "calc(", sufixUnit: ")" }
      }
    }];
    DrawDatas.menuSubItemSeparator = [{
      property: "background-color",
      data: {
        default: { min: [92, 108, 192, 1], max: [255, 255, 255, 0.5], prefixUnit: "rgba(", sufixUnit: ")", separatorUnit: ", " }
      }
    }];

    DrawDatas.helper = [{
      property: "height",
      data: {
        default: { min: DrawDatas.maxHeight, max: DrawDatas.maxHeight, unit: "px" }
      }
    }];
    DrawDatas.helperWithFloatingButton = [...DrawDatas.helper];
    DrawDatas.helperWithFloatingButton.push({
      property: "margin-bottom",
      data: {
        default: { min: 0, max: 45, unit: "px" },
        small: { min: 0, max: 38, unit: "px" },
        xsmall: { min: 0, max: 38, unit: "px" }
      }
    });

    DrawDatas.header = [{
      property: "opacity",
      data: {
        default: { min: 1, max: 0 }
      }
    }];

    DrawDatas.scroll = [{
      property: "height",
      data: {
        default: { min: DrawDatas.screenHeight - DrawDatas.minHeight, max: DrawDatas.screenHeight - DrawDatas.maxHeight, unit: "px" }
      }
    }];

    // Заголовок
    DrawDatas.title = [{
      property: "font-size",
      data: {
        default: { min: 15, max: 70, unit: "px" },
        large: { min: 15, max: 60, unit: "px" },
        middle: { min: 15, max: 48, unit: "px" },
        small: { min: 15, max: 32, unit: "px" },
        xsmall: { min: 15, max: 24, unit: "px" },
      }
    }, {
      property: "line-height",
      data: {
        default: { min: 20, max: 90, unit: "px" },
        large: { min: 20, max: 76, unit: "px" },
        middle: { min: 20, max: 60, unit: "px" },
        small: { min: 20, max: 40, unit: "px" },
        xsmall: { min: 20, max: 32, unit: "px" },
      }
    }];
    // Заголовок с кнопкой меню или назад
    DrawDatas.titleWithBackButton = [...DrawDatas.title];
    DrawDatas.titleWithBackButton.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        middle: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 15, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 15, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - DrawDatas.minHeight, max: DrawDatas.containerWidth, unit: "px" },
        small: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
      }
    });
    // Заголовок с аватаркой
    DrawDatas.titleWithAvatar = [...DrawDatas.title];
    DrawDatas.titleWithAvatar.push({
      property: "margin-left",
      data: {
        default: { min: 48, max: 192, unit: "px" },
        large: { min: 48, max: 150, unit: "px" },
        middle: { min: 48, max: 112, unit: "px" },
        small: { min: 48, max: 85, unit: "px" },
        xsmall: { min: 48, max: 73, unit: "px" },
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 150, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 112, unit: "px" },
      }
    });
    // Заголовок с аватаркой и кнопкой
    DrawDatas.titleWithBackButtonAndAvatar = [...DrawDatas.title];
    DrawDatas.titleWithBackButtonAndAvatar.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight + 48, max: 192, unit: "px" },
        large: { min: 113, max: 153, unit: "px" },
        middle: { min: 113, max: 105, unit: "px" },
        small: { min: 113, max: 90, unit: "px" },
        xsmall: { min: 113, max: 78, unit: "px" },
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - (DrawDatas.minHeight + 48), max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 153, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 105, unit: "px" },
        small: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 90 - 15, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 78 - 15, unit: "px" },
      }
    });
    // Отступ и ширина заголовка
    DrawDatas.title.push({
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth, max: DrawDatas.containerWidth, unit: "px" },
      }
    });

    // Подзаголовок
    DrawDatas.subtitle = [
      // Размер шрифта
      {
        property: "font-size",
        data: {
          default: { min: 13, max: 40, unit: "px" },
          xsmall: { min: 13, max: 16, unit: "px" },
          small: { min: 13, max: 20, unit: "px" },
          middle: { min: 13, max: 24, unit: "px" },
          large: { min: 13, max: 32, unit: "px" }
        }
      },
      // Высота строки
      {
        property: "line-height",
        data: {
          default: { min: 18, max: 52, unit: "px" },
          xsmall: { min: 18, max: 22, unit: "px" },
          small: { min: 18, max: 30, unit: "px" },
          middle: { min: 18, max: 32, unit: "px" },
          large: { min: 18, max: 40, unit: "px" }
        }
      },
      // Высота
      {
        property: "max-height",
        data: {
          default: { min: 18, max: 52 * DrawDatas.getSubTitleLines, unit: "px" },
          xsmall: { min: 18, max: 22 * DrawDatas.getSubTitleLines, unit: "px" },
          small: { min: 18, max: 30 * DrawDatas.getSubTitleLines, unit: "px" },
          middle: { min: 18, max: 32 * DrawDatas.getSubTitleLines, unit: "px" },
          large: { min: 18, max: 40 * DrawDatas.getSubTitleLines, unit: "px" }
        }
      },
      // Количество линий
      {
        property: "-webkit-line-clamp",
        data: {
          default: { min: 1, max: DrawDatas.getSubTitleLines },
          xsmall: { min: 1, max: DrawDatas.getSubTitleLines },
          small: { min: 1, max: DrawDatas.getSubTitleLines },
          middle: { min: 1, max: DrawDatas.getSubTitleLines },
          large: { min: 1, max: DrawDatas.getSubTitleLines }
        }
      }
    ];
    // Подзаголовок с кнопкой меню или назад
    DrawDatas.subtitleWithBackButton = [...DrawDatas.subtitle];
    DrawDatas.subtitleWithBackButton.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        middle: { min: DrawDatas.minHeight, max: 30, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 15, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 15, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - DrawDatas.minHeight, max: DrawDatas.containerWidth, unit: "px" },
        small: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - (DrawDatas.minHeight * 2), max: DrawDatas.containerWidth - 30, unit: "px" },
      }
    });
    // Подзаголовок с аватаркой
    DrawDatas.subtitleWithAvatar = [...DrawDatas.subtitle];
    DrawDatas.subtitleWithAvatar.push({
      property: "margin-left",
      data: {
        default: { min: 48, max: 192, unit: "px" },
        xsmall: { min: 48, max: 73, unit: "px" },
        small: { min: 48, max: 85, unit: "px" },
        middle: { min: 48, max: 112, unit: "px" },
        large: { min: 48, max: 150, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 150, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 48, max: DrawDatas.containerWidth - 112, unit: "px" },
      }
    });
    // Подзаголовок с аватаркой и кнопкой
    DrawDatas.subtitleWithBackButtonAndAvatar = [...DrawDatas.subtitle];
    DrawDatas.subtitleWithBackButtonAndAvatar.push({
      property: "margin-left",
      data: {
        default: { min: DrawDatas.minHeight + 48, max: 192, unit: "px" },
        xsmall: { min: 113, max: 78, unit: "px" },
        small: { min: 113, max: 90, unit: "px" },
        middle: { min: 113, max: 105, unit: "px" },
        large: { min: 113, max: 153, unit: "px" },
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth - (DrawDatas.minHeight + 48), max: DrawDatas.containerWidth - 192, unit: "px" },
        large: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 153, unit: "px" },
        middle: { min: DrawDatas.containerLeftWidth - 113, max: DrawDatas.containerWidth - 105, unit: "px" },
        small: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 90 - 15, unit: "px" },
        xsmall: { min: DrawDatas.containerWidth - 113 - 60, max: DrawDatas.containerWidth - 78 - 15, unit: "px" },
      }
    });
    // Отступ подзаголовка
    DrawDatas.subtitle.push({
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" }
      }
    }, {
      property: "width",
      data: {
        default: { min: DrawDatas.containerLeftWidth, max: DrawDatas.containerWidth, unit: "px" },
      }
    });

    // Аватарка
    DrawDatas.avatar = [{
      property: ["width", "height", "line-height"],
      data: {
        default: { min: 38, max: 152, unit: "px" },
        xsmall: { min: 38, max: 48, unit: "px" },
        small: { min: 38, max: 60, unit: "px" },
        middle: { min: 38, max: 84, unit: "px" },
        large: { min: 38, max: 118, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 28, max: 114, unit: "px" },
        xsmall: { min: 28, max: 36, unit: "px" },
        small: { min: 28, max: 45, unit: "px" },
        middle: { min: 28, max: 63, unit: "px" },
        large: { min: 28, max: 88, unit: "px" }
      }
    }, {
      property: "left",
      data: {
        default: { min: 0, max: 0, unit: "px" }
      }
    }];
    // Аватарка с кнопкой назад или меню
    DrawDatas.avatarWithBackButton = [...DrawDatas.avatar];
    DrawDatas.avatarWithBackButton.push({
      property: "left",
      data: {
        default: { min: DrawDatas.minHeight, max: 0, unit: "px" },
        small: { min: DrawDatas.minHeight, max: 15, unit: "px" },
        xsmall: { min: DrawDatas.minHeight, max: 15, unit: "px" },
      }
    });

    // Картинка
    DrawDatas.image = [{
      property: "height",
      data: {
        default: { min: DrawDatas.maxHeight, max: DrawDatas.maxHeight, unit: "px" },
      }
    }, {
      property: "top",
      data: {
        default: { min: -(DrawDatas.maxHeight - DrawDatas.minHeight) / 2, max: 0, unit: "px" },
      }
    }, {
      property: "filter",
      data: {
        default: { min: 5, max: 0, prefixUnit: "blur(", unit: "px)" },
      }
    }];

    DrawDatas.floatingButton = [{
      property: "box-shadow",
      data: {
        default: { min: 0, max: 0.15, prefixUnit: "1px 1px 10px 1px rgba(0,0,0,", unit: ")" }
      }
    }, {
      property: ["width", "min-width", "height", "line-height"],
      data: {
        default: { min: 60, max: 90, unit: "px" },
        small: { min: 60, max: 76, unit: "px" },
        xsmall: { min: 60, max: 76, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 24, max: 48, unit: "px" },
        small: { min: 24, max: 36, unit: "px" },
        xsmall: { min: 24, max: 36, unit: "px" }
      }
    }, {
      property: "margin-bottom",
      data: {
        default: { min: 0, max: (DrawDatas.type == "short" ? -45 : 15), unit: "px" },
        small: { min: 0, max: (DrawDatas.type == "short" ? -38 : 15), unit: "px" },
        xsmall: { min: 0, max: (DrawDatas.type == "short" ? -38 : 15), unit: "px" }
      }
    }, {
      property: "margin-right",
      data: {
        default: { min: 0, max: 0, unit: "px" },
        small: { min: 0, max: 15, unit: "px" },
        xsmall: { min: 0, max: 15, unit: "px" }
      }
    }];
    DrawDatas.floatingButtonOverlay = [{
      property: "opacity",
      data: {
        default: { min: 0, max: 1 }
      }
    }];

    DrawDatas.backButton = [{
      property: "top",
      data: {
        default: { min: 0, max: 15, unit: "px" },
        small: { min: 0, max: 0, unit: "px" },
        xsmall: { min: 0, max: 0, unit: "px" }
      }
    }, {
      property: "margin-left",
      data: {
        default: { min: 0, max: 0, unit: "px" },
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 32, max: 48, unit: "px" },
        small: { min: 24, max: 24, unit: "px" },
        xsmall: { min: 24, max: 24, unit: "px" }
      }
    }];

    DrawDatas.toContentButton = [{
      property: ["width", "height", "line-height"],
      data: {
        default: { min: 0, max: 90, unit: "px" },
        small: { min: 0, max: 70, unit: "px" },
        xsmall: { min: 0, max: 60, unit: "px" }
      }
    }, {
      property: "font-size",
      data: {
        default: { min: 0, max: 68, unit: "px" },
        small: { min: 0, max: 52, unit: "px" },
        xsmall: { min: 0, max: 40, unit: "px" }
      }
    }, {
      property: "margin-bottom",
      data: {
        default: { min: 0, max: 15, unit: "px" },
        small: { min: 0, max: 10, unit: "px" },
        xsmall: { min: 0, max: 5, unit: "px" }
      }
    }, {
      property: "opacity",
      data: {
        default: { min: 0, max: 1, unit: "px" }
      }
    }];
  }
}
