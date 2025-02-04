import { ParseInt } from "@_helpers/math";
import { CustomObject } from "@_models/app";
import { MinMax } from "@_models/math";
import { CssProperty, DrawData, DrawDataArray, DrawDataKeys, DrawDataPeriod, DrawInterface } from "@_models/nav-menu";





// Класс с параметрами
export class DrawDatas {


  static type: "full" | "short" | "collapse" = "collapse";
  static minHeight: number = 60;
  static screenWidth: number = 0;
  static screenHeight: number = 0;
  static containerWidth: number = 0;
  static containerLeftWidth: number = 0;

  static menu: DrawInterface[];
  static menuLayer: DrawInterface[];
  static menuContainer: DrawInterface[];
  static menuList: DrawInterface[];
  static menuSubList: DrawInterface[];
  static menuSubListDecorator: DrawInterface[];
  static menuListWithFloatingButton: DrawInterface[];
  static menuItem: DrawInterface[];
  static menuItemIcon: DrawInterface[];
  static menuItemIconAndText: DrawInterface[];
  static menuItemLine: DrawInterface[];
  static menuItemCounter: DrawInterface[];
  static menuItemCounterElm: DrawInterface[];
  static menuSubItem: DrawInterface[];
  static menuSubItemLast: DrawInterface[];
  static menuSubItemLine: DrawInterface[];
  static menuSubItemSeparator: DrawInterface[];
  static notificationsList: DrawInterface[];
  static helper: DrawInterface[];
  static helperWithFloatingButton: DrawInterface[];
  static header: DrawInterface[];
  static scroll: DrawInterface[];
  static title: DrawInterface[];
  static titleWithBackButton: DrawInterface[];
  static titleWithBackButtonAndAvatar: DrawInterface[];
  static titleWithAvatar: DrawInterface[];
  static subtitle: DrawInterface[];
  static subtitleWithBackButton: DrawInterface[];
  static subtitleWithBackButtonAndAvatar: DrawInterface[];
  static subtitleWithAvatar: DrawInterface[];
  static image: DrawInterface[];
  static avatar: DrawInterface[];
  static avatarWithBackButton: DrawInterface[];
  static floatingButton: DrawInterface[];
  static floatingButtonOverlay: DrawInterface[];
  static backButton: DrawInterface[];
  static toContentButton: DrawInterface[];

  private static defaultIconSize: number = this.minHeight;
  private static defaultSpacing: number = 15;
  private static floatButtonSizes: DrawDataArray = {
    default: [this.minHeight, 90, "px"],
    small: [this.minHeight, 76, "px"],
    xsmall: [this.minHeight, 76, "px"],
    xxsmall: [this.minHeight, 76, "px"],
  };
  private static menuItemSizes: DrawDataArray = {
    default: [this.minHeight, this.minHeight, "px"],
  };
  private static titleSizes: DrawDataArray = {
    default: [20, 90, "px"],
    large: [20, 76, "px"],
    middle: [20, 60, "px"],
    small: [20, 40, "px"],
    xsmall: [20, 32, "px"],
    xxsmall: [20, 32, "px"],
  };
  private static avatarSizes: DrawDataArray = {
    default: [38, 152, "px"],
    large: [38, 118, "px"],
    middle: [38, 84, "px"],
    small: [38, 60, "px"],
    xsmall: [38, 48, "px"],
    xxsmall: [38, 48, "px"],
  };
  private static avatarSpacings: DrawDataArray = {
    default: [10, 40, "px"],
    large: [10, 32, "px"],
    middle: [10, 28, "px"],
    small: [10, 15, "px"],
    xsmall: [10, 15, "px"],
    xxsmall: [10, 15, "px"],
  };
  private static subTitlesLineHeights: DrawDataArray = {
    default: [18, 52, "px"],
    xxsmall: [18, 22, "px"],
    xsmall: [18, 22, "px"],
    small: [18, 30, "px"],
    middle: [18, 32, "px"],
    large: [18, 40, "px"]
  };
  private static notificationsListSpacing: DrawDataArray = {
    default: [10, 10, "px"],
  };





  // Высота короткой шапки
  private static get shortHeight(): number {
    if (this.screenWidth < 900) {
      return 240;
    }
    // Для средних экранов
    if (this.screenWidth < 1200) {
      return 320;
    }
    // По умолчанию
    return 440;
  }

  // Допустимая максимальная высота шапки
  static get maxHeight(): number {
    if (this.type === "full") {
      return this.screenHeight;
    }

    else if (this.type === "short") {
      return this.screenHeight > this.shortHeight ? this.shortHeight : this.screenHeight;
    }

    return this.minHeight;
  }

  // Количество линий для подзаголовка
  private static get getSubTitleLines(): number {
    if (this.type === "full") {
      return 6;
    }

    else if (this.type === "short") {
      return 3;
    }

    return 1;
  }

  // Получить список свойств
  private static getProperties(key: string, properties: CssProperty[]): DrawInterface[] {
    const allProperties: DrawInterface[] = this.hasOwnProperty(key) ? DrawDatas[key] : null;
    // Свойство найдено
    if (!!allProperties && Array.isArray(allProperties)) {
      return allProperties
        .filter(({ property }) => Array.isArray(property) ? property.some(p => properties.includes(p)) : properties.includes(property))
        .map(data => {
          const property: CssProperty | CssProperty[] = Array.isArray(data.property)
            ? data.property.filter(p => properties.includes(p))
            : data.property;
          // Вернуть данные
          return { ...data, property };
        });
    }
    // Свойство не найдено
    return null;
  }

  // Получить значение свойства
  private static getScreenProperty(
    key: string,
    property: CssProperty,
    screen: keyof DrawData,
    callback?: (data: DrawDataPeriod, screen: keyof DrawData) => DrawDataPeriod
  ): DrawDataPeriod {
    const properties: DrawInterface = (this.getProperties(key, [property]) ?? [])[0];
    // Свойство найдено
    if (!!properties) {
      screen = properties.data.hasOwnProperty(screen) ? screen : "default";
      // Вернуть значение
      return !!callback ? callback(properties.data[screen], screen) : properties.data[screen];
    }
    // Свойство не найдено
    return null;
  }

  // Смешать свойства
  private static mixProperties(
    keys: CustomObject<CssProperty[]>,
    property: CssProperty | CssProperty[],
    callback: (datas: CustomObject<CustomObject<DrawDataPeriod>>, screen: keyof DrawData) => DrawDataPeriod
  ): DrawInterface {
    const data: DrawData = DrawDataKeys
      .map(screen => {
        const datas: CustomObject<CustomObject<DrawDataPeriod>> = Object.entries(keys)
          .map(([k, ps]) => ({ k, ds: ps.map(p => ({ p, d: this.getScreenProperty(k, p, screen) })) }))
          .reduce((o, { k, ds }) => ({ ...o, [k]: ds.reduce((o, { p, d }) => ({ ...o, [p]: d }), {}) }), {});
        // Вернуть данные
        return { screen, data: callback(datas, screen) };
      })
      .reduce((o, { screen, data }) => ({ ...o, [screen]: data }), { default: null } as DrawData);
    // Вернуть данные
    return { property, data };
  }

  // Получить значение из массива
  private static getValueFromArray(sizes: DrawDataArray, screen: keyof DrawData, type: MinMax | "unit"): number | string {
    const index: number = [MinMax.min, MinMax.max, "unit"].findIndex(t => t === type);
    return (sizes.hasOwnProperty(screen) ? sizes[screen] : sizes.default)[index];
  }

  // Данные из массива преобразовать в объект
  private static valueArrayToDrawData(
    sizes: DrawDataArray,
    minF?: (value: number, screen?: keyof DrawData) => number,
    maxF?: (value: number, screen?: keyof DrawData) => number
  ): DrawData {
    return DrawDataKeys
      .filter(screen => sizes.hasOwnProperty(screen))
      .reduce((o, screen) => {
        const unit: string = this.getValueFromArray(sizes, screen, "unit") as string;
        let min: number = ParseInt(this.getValueFromArray(sizes, screen, MinMax.min));
        let max: number = ParseInt(this.getValueFromArray(sizes, screen, MinMax.max));
        // Преобразовать данные
        min = !!minF ? minF(min, screen) : min;
        max = !!maxF ? maxF(max, screen) : max;
        // Вернуть значение
        return { ...o, [screen]: { min, max, unit } } as DrawData;
      },
        { default: null }
      );
  }





  // Заполнение данных: основное
  private static dataRenderBase(): void {
    // Шапка
    this.header = [
      // Прозрачность
      {
        property: "opacity",
        data: {
          default: { min: 1, max: 0 }
        }
      }
    ];
    // Скролл
    this.scroll = [
      // Высота
      {
        property: "height",
        data: {
          default: { min: this.screenHeight - this.minHeight, max: this.screenHeight - this.maxHeight, unit: "px" }
        }
      }
    ];
    // Заполнитель меню
    this.helper = [
      // Высота
      {
        property: "height",
        data: {
          default: { min: this.maxHeight, max: this.maxHeight, unit: "px" }
        }
      }
    ];
    // Заполнитель меню: с плавающей кнопкой
    this.helperWithFloatingButton = [
      ...this.helper,
      // Отступ снизу
      {
        property: "marginBottom",
        data: this.valueArrayToDrawData(this.floatButtonSizes, () => 0, v => this.type == "short" ? v / 2 : 0)
      }
    ];
    // Кнопка назад
    this.backButton = [
      //
      {
        property: "top",
        data: {
          default: { min: 0, max: this.defaultSpacing, unit: "px" },
          small: { min: 0, max: 0, unit: "px" },
          xsmall: { min: 0, max: 0, unit: "px" },
          xxsmall: { min: 0, max: 0, unit: "px" }
        }
      },
      //
      {
        property: "marginLeft",
        data: {
          default: { min: 0, max: 0, unit: "px" },
        }
      },
      //
      {
        property: "fontSize",
        data: {
          default: { min: 32, max: 48, unit: "px" },
          small: { min: 24, max: 24, unit: "px" },
          xsmall: { min: 24, max: 24, unit: "px" },
          xxsmall: { min: 24, max: 24, unit: "px" }
        }
      }
    ];
    // Картинка
    this.image = [
      // Высота
      {
        property: "height",
        data: {
          default: { min: this.maxHeight, max: this.maxHeight, unit: "px" },
        }
      },
      // Позиция сверху
      {
        property: "top",
        data: {
          default: { min: -(this.maxHeight - this.minHeight) / 2, max: 0, unit: "px" },
        }
      },
      // Размытие
      {
        property: "filter",
        data: {
          default: { min: 5, max: 0, prefixUnit: "blur(", unit: "px)" },
        }
      }
    ];
    // Кнопка свернуть шапку
    this.toContentButton = [
      // Размер
      {
        property: ["width", "height", "lineHeight"],
        data: this.valueArrayToDrawData(this.floatButtonSizes, () => 0)
      },
      // Размер шрифта
      {
        property: "fontSize",
        data: this.valueArrayToDrawData(this.floatButtonSizes, () => 0, v => v * 0.8)
      },
      // Отступ снизу
      {
        property: "marginBottom",
        data: {
          default: { min: 0, max: 15, unit: "px" },
          small: { min: 0, max: 10, unit: "px" },
          xsmall: { min: 0, max: 5, unit: "px" },
          xxsmall: { min: 0, max: 5, unit: "px" }
        }
      },
      // Прозрачность
      {
        property: "opacity",
        data: {
          default: { min: 0, max: 1, unit: "px" }
        }
      }
    ];
  }

  // Заполнение данных: плавающая кнопка
  private static dataRenderFloatingButton(): void {
    // Плавающая кнопка
    this.floatingButton = [
      // Тень
      {
        property: "boxShadow",
        data: {
          default: { min: 0, max: 0.15, prefixUnit: "1px 1px 10px 1px rgba(0,0,0,", unit: ")" }
        }
      },
      // Размер
      {
        property: ["width", "minWidth", "height", "lineHeight"],
        data: this.valueArrayToDrawData(this.floatButtonSizes)
      },
      // Размер шрифта
      {
        property: "fontSize",
        data: this.valueArrayToDrawData(this.floatButtonSizes, v => v * 0.5, v => v * 0.5)
      },
      // Отступ снизу
      {
        property: "marginBottom",
        data: this.valueArrayToDrawData(this.floatButtonSizes, () => 0, v => this.type == "short" ? -v / 2 : this.defaultSpacing)
      },
      // Отступ справа
      {
        property: "marginRight",
        data: {
          default: { min: 0, max: 0, unit: "px" },
          small: { min: 0, max: this.defaultSpacing, unit: "px" },
          xsmall: { min: 0, max: this.defaultSpacing, unit: "px" },
          xxsmall: { min: 0, max: this.defaultSpacing, unit: "px" }
        }
      }
    ];
    // Плавающая кнопка: Затенение
    this.floatingButtonOverlay = [
      // Прозрачность
      {
        property: "opacity",
        data: {
          default: { min: 0, max: 1 }
        }
      }
    ];
  }

  // Заполнение данных: главное меню
  private static dataRenderMenu(): void {
    // Меню
    this.menu = [
      // Высота
      {
        property: "height",
        data: {
          default: { min: this.minHeight, max: this.maxHeight, unit: "px" }
        }
      },
    ];
    // Обертка меню
    this.menuLayer = [
      // Способ отображения
      {
        property: "display",
        data: {
          default: { value: { default: "flex" } },
          small: { value: { default: "none" } },
          xsmall: { value: { default: "none" } },
          xxsmall: { value: { default: "none" } },
        }
      }
    ];
    // Главное содержимое
    this.menuContainer = [
      // Макет колонок сетки
      {
        property: "gridTemplateColumns",
        data: {
          default: { value: { default: "minmax(1px, 1fr) auto auto" } },
          small: { value: { default: "minmax(1px, 1fr) auto" } },
          xsmall: { value: { default: "minmax(1px, 1fr) auto" } },
          xxsmall: { value: { default: "minmax(1px, 1fr) auto" } },
        }
      },
      // Макет блоков в сетке
      {
        property: "gridTemplateAreas",
        data: {
          default: { value: { default: "'left center right' 'full full full'" } },
          small: { value: { default: "'left right' 'full full'" } },
          xsmall: { value: { default: "'left right' 'full full'" } },
          xxsmall: { value: { default: "'left right' 'full full'" } },
        }
      },
      // Макет внутренних отступов сетки
      {
        property: "gridGap",
        data: {
          default: { min: [0, this.defaultSpacing], max: [0, this.defaultSpacing], unit: "px", separatorUnit: " " },
          small: { min: 0, max: 0, unit: "px" },
          xsmall: { min: 0, max: 0, unit: "px" },
          xxsmall: { min: 0, max: 0, unit: "px" }
        }
      }
    ];
    // Главное меню
    this.menuList = [
      // Позиция справа
      {
        property: "right",
        data: {
          default: { min: -this.defaultSpacing, max: -this.defaultSpacing, unit: "px" }
        }
      }
    ];
    // Главное меню: с плавающей кнопкой
    this.menuListWithFloatingButton = [
      // Положение справа
      {
        property: "right",
        data: this.valueArrayToDrawData(this.floatButtonSizes, () => 0, v => -(v + this.defaultSpacing))
      }
    ];

    // Кнопка меню
    this.menuItem = [
      // Размер шрифта
      {
        property: "fontSize",
        data: {
          default: { min: 13, max: 18, unit: "px" },
          middle: { min: 13, max: 16, unit: "px" },
          large: { min: 13, max: 16, unit: "px" }
        }
      },
      // Высота
      {
        property: ["lineHeight", "height"],
        data: this.valueArrayToDrawData(this.menuItemSizes)
      },
      // Отступ сверху
      {
        property: "marginTop",
        data: this.valueArrayToDrawData(this.menuItemSizes, v => (this.minHeight - v) / 2, () => this.defaultSpacing)
      },
      // Внутренние отступы по горизонтали
      {
        property: ["paddingLeft", "paddingRight"],
        data: {
          default: { min: 20, max: 30, unit: "px" },
          middle: { min: 16, max: 10, unit: "px" },
          large: { min: 16, max: 16, unit: "px" }
        }
      }
    ];
    // Кнопка меню: иконка
    this.menuItemIconAndText = [
      // Размер
      {
        property: ["width", "height", "lineHeight"],
        data: this.valueArrayToDrawData(this.menuItemSizes)
      },
      // Размер шрифта
      {
        property: "fontSize",
        data: this.valueArrayToDrawData(this.menuItemSizes, () => this.minHeight * 0.5, v => v * 0.6)
      },
      // Внешний отступ слева
      this.mixProperties({ menuItem: ["paddingLeft"] }, "marginLeft", d => {
        const data: CustomObject<DrawDataPeriod> = d.menuItem;
        const min: number = -ParseInt(data["paddingLeft"].min);
        const max: number = -ParseInt(data["paddingLeft"].max);
        // Вернуть данные
        return { min, max, unit: "px" };
      }),
      // Внешний отступ справа
      this.mixProperties({ menuItem: ["paddingRight"] }, "marginRight", d => {
        const data: CustomObject<DrawDataPeriod> = d.menuItem;
        const min: number = ParseInt(data["paddingRight"].min) / 2;
        const max: number = ParseInt(data["paddingRight"].max) / 2;
        // Вернуть данные
        return { min, max, unit: "px" };
      })
    ];
    // Кнопка меню: иконка без текста
    this.menuItemIcon = [
      ...this.getProperties("menuItemIconAndText", ["width", "height", "lineHeight", "fontSize", "marginLeft"]),
      // Внешний отступ справа
      this.mixProperties({ menuItem: ["paddingRight", "paddingLeft", "height"] }, "marginRight", d => {
        const data: CustomObject<DrawDataPeriod> = d.menuItem;
        const min: number = -Math.min(ParseInt(data["paddingRight"].min), ParseInt(data.height.min) - ParseInt(data["paddingLeft"].min));
        const max: number = -Math.min(ParseInt(data["paddingRight"].max), ParseInt(data.height.max) - ParseInt(data["paddingLeft"].max));
        // Вернуть данные
        return { min, max, unit: "px" };
      })
    ];
    // Кнопка меню: счетчик
    this.menuItemCounter = [
      // Размеры
      {
        property: ["width", "height"],
        data: {
          default: { min: 22, max: 26, unit: "px" },
          large: { min: 22, max: 24, unit: "px" },
          middle: { min: 20, max: 22, unit: "px" }
        }
      },
      // Позиция сверху
      {
        property: ["top"],
        data: {
          default: { min: 5, max: -13, unit: "px" },
          large: { min: 0, max: -12, unit: "px" },
          middle: { min: 0, max: -11, unit: "px" }
        }
      },
      // Позиция справа
      {
        property: ["right"],
        data: {
          default: { min: 0, max: 0, unit: "px" }
        }
      }
    ];
    // Кнопка меню: элемент счетчика
    this.menuItemCounterElm = [
      ...this.getProperties("menuItemCounter", ["width"]),
      // Высота строки
      this.mixProperties({ menuItemCounter: ["height"] }, "lineHeight", d => d.menuItemCounter["height"]),
      // Высота
      {
        property: "height",
        data: {
          default: { min: 0, max: 100, unit: "%" }
        }
      },
      // Прозрачность
      {
        property: "opacity",
        data: {
          default: { min: 0.5, max: 1 }
        }
      },
      // Шрифт
      {
        property: ["fontSize"],
        data: {
          default: { min: 12, max: 14, unit: "px" },
          large: { min: 12, max: 13, unit: "px" },
          middle: { min: 11, max: 12, unit: "px" }
        }
      },
    ];
    // Кнопка меню: линия
    this.menuItemLine = [
      // Высота
      {
        property: "height",
        data: this.valueArrayToDrawData(this.menuItemSizes, v => v, v => v / 20)
      }
    ];

    // Выпадающее меню
    this.menuSubList = [
      // Фоновый цвет
      {
        property: "backgroundColor",
        data: {
          default: { min: [49, 65, 165, 1], max: [0, 0, 0, 0.8], prefixUnit: "rgba(", sufixUnit: ")", separatorUnit: ", " }
        }
      },
      // Ширина границ
      {
        property: "borderWidth",
        data: {
          default: { min: [1, 0, 0, 0], max: [0, 1, 1, 1], separatorUnit: " ", unit: "px" }
        }
      },
      // Цвет границ
      {
        property: "borderColor",
        data: {
          default: { min: [92, 108, 192, 1], max: [255, 255, 255, 1], separatorUnit: ", ", prefixUnit: "rgba(", sufixUnit: ")" }
        }
      },
      // Округление углов
      {
        property: "borderRadius",
        data: {
          default: { min: [0, 0, 0, 0], max: [0, 0, 5, 5], unit: "px", separatorUnit: " " }
        }
      }
    ];
    // Выпадающее меню: линия посещаемой кнопки
    this.menuSubListDecorator = [
      // Ширина
      {
        property: "width",
        data: {
          default: { min: 0, max: this.minHeight, unit: "px", prefixUnit: "calc(100% + ", sufixUnit: ")" }
        }
      },
      // Высота
      {
        property: "height",
        data: {
          default: { min: 0, max: 1, unit: "px" }
        }
      },
      // Положение слева
      {
        property: "left",
        data: {
          default: { min: 0, max: -(this.minHeight / 2), unit: "px" }
        }
      }
    ];

    // Кнопка выпадающего меню
    this.menuSubItem = [
      // Отступы по горизонтали
      {
        property: ["paddingLeft", "paddingRight"],
        data: {
          default: { min: 26, max: 38, unit: "px" }
        }
      },
      // Высота текста
      {
        property: "lineHeight",
        data: {
          default: { min: 44, max: 56, unit: "px" }
        }
      },
      // Размер шрифта
      {
        property: "fontSize",
        data: {
          default: { min: 14, max: 17, unit: "px" }
        }
      }
    ];
    // Кнопка выпадающего меню: последняя кнопка
    this.menuSubItemLast = [
      ...this.menuSubItem,
      // Закругление углов
      {
        property: "borderRadius",
        data: {
          default: { min: [0, 0, 0, 0], max: [0, 0, 5, 5], unit: "px", separatorUnit: " " }
        }
      }
    ];
    // Кнопка выпадающего меню: линия посещаемой кнопки
    this.menuSubItemLine = [
      // Ширина
      {
        property: "width",
        data: {
          default: { min: [100, 0], max: [0, 5], unit: ["%", "px"], separatorUnit: " + ", prefixUnit: "calc(", sufixUnit: ")" }
        }
      }
    ];
    // Кнопка выпадающего меню: разделитель
    this.menuSubItemSeparator = [
      // Фоновый цвет
      {
        property: "backgroundColor",
        data: {
          default: { min: [92, 108, 192, 1], max: [255, 255, 255, 0.5], prefixUnit: "rgba(", sufixUnit: ")", separatorUnit: ", " }
        }
      }
    ];

    // Уведомления
    this.notificationsList = [
      // Позиция сверху
      this.mixProperties({ menuItem: ["height", "marginTop"] }, "top", (d, s) => {
        const data: CustomObject<DrawDataPeriod> = d.menuItem;
        const height: DrawDataPeriod = data.height;
        const marginTop: DrawDataPeriod = data["marginTop"];
        const spacingMin: number = ParseInt(this.getValueFromArray(this.notificationsListSpacing, s, MinMax.min));
        const spacingMax: number = ParseInt(this.getValueFromArray(this.notificationsListSpacing, s, MinMax.max));
        let min: number = ParseInt(height.min) + ParseInt(marginTop.min) + spacingMin;
        let max: number = ParseInt(height.max) + ParseInt(marginTop.max) + spacingMax;
        // Для мобильного меню
        if (s === "small" || s === "xsmall" || s === "xxsmall") {
          min = ParseInt(height.min);
          max = ParseInt(height.max);
        }
        // Вернуть данные
        return { min, max, unit: "px" };
      }),
      // Максимальная высота
      this.mixProperties({ menuItem: ["height", "marginTop"] }, "maxHeight", (d, s) => {
        const data: CustomObject<DrawDataPeriod> = d.menuItem;
        const height: DrawDataPeriod = data.height;
        const marginTop: DrawDataPeriod = data["marginTop"];
        const spacingMin: number = ParseInt(this.getValueFromArray(this.notificationsListSpacing, s, MinMax.min));
        const spacingMax: number = ParseInt(this.getValueFromArray(this.notificationsListSpacing, s, MinMax.max));
        let min: number = this.screenHeight - ParseInt(height.min) - ParseInt(marginTop.min) - (spacingMin * 2);
        let max: number = this.screenHeight - ParseInt(height.max) - ParseInt(marginTop.max) - (spacingMax * 2);
        // Для мобильного меню
        if (s === "small" || s === "xsmall" || s === "xxsmall") {
          min = this.screenHeight - (ParseInt(height.min) * 2);
          max = this.screenHeight - (ParseInt(height.max) * 2);
        }
        // Вернуть данные
        return { min, max, unit: "px" };
      })
    ];
  }

  // Заполнение данных: аватарка / иконка
  private static dataRenderAvatar(): void {
    // Аватарка
    this.avatar = [
      // Размеры
      {
        property: ["width", "height", "lineHeight"],
        data: this.valueArrayToDrawData(this.avatarSizes)
      },
      // Размер шрифта
      {
        property: "fontSize",
        data: this.valueArrayToDrawData(this.avatarSizes, v => v * 0.6, v => v * 0.6)
      },
      // Позиция слева
      {
        property: "left",
        data: {
          default: { min: 0, max: 0, unit: "px" }
        }
      }
    ];
    // Аватарка: С кнопкой назад или меню
    this.avatarWithBackButton = [
      ...this.getProperties("avatar", ["width", "height", "lineHeight", "fontSize"]),
      //
      {
        property: "left",
        data: {
          default: { min: this.defaultIconSize, max: 0, unit: "px" },
          small: { min: this.defaultIconSize, max: this.defaultSpacing, unit: "px" },
          xsmall: { min: this.defaultIconSize, max: this.defaultSpacing, unit: "px" },
          xxsmall: { min: this.defaultIconSize, max: this.defaultSpacing, unit: "px" },
        }
      }
    ];
  }

  // Заполнение данных: заголовок
  private static dataRenderTitle(): void {
    // Заголовок
    this.title = [
      //
      {
        property: "fontSize",
        data: this.valueArrayToDrawData(this.titleSizes, () => 15, v => v * 0.73)
      },
      //
      {
        property: "lineHeight",
        data: this.valueArrayToDrawData(this.titleSizes)
      },
      //
      {
        property: "marginLeft",
        data: {
          default: { min: 0, max: 0, unit: "px" }
        }
      },
      //
      {
        property: "width",
        data: {
          default: { min: this.containerLeftWidth, max: this.containerWidth, unit: "px" },
        }
      }
    ];
    // Заголовок: с кнопкой меню или назад
    this.titleWithBackButton = [
      ...this.getProperties("title", ["fontSize", "lineHeight"]),
      // Отступ слева
      {
        property: "marginLeft",
        data: {
          default: { min: this.defaultIconSize, max: 0, unit: "px" },
          small: { min: this.defaultIconSize, max: 15, unit: "px" },
          xsmall: { min: this.defaultIconSize, max: 15, unit: "px" },
          xxsmall: { min: this.defaultIconSize, max: 15, unit: "px" }
        }
      },
      // Ширина
      {
        property: "width",
        data: {
          default: { min: this.containerLeftWidth - this.defaultIconSize, max: this.containerWidth, unit: "px" },
          small: { min: this.containerWidth - this.defaultIconSize, max: this.containerWidth - 15, unit: "px" },
          xsmall: { min: this.containerWidth - this.defaultIconSize, max: this.containerWidth - 15, unit: "px" },
          xxsmall: { min: this.containerWidth - this.defaultIconSize, max: this.containerWidth - 15, unit: "px" },
        }
      }
    ];
    // Заголовок: с аватаркой
    this.titleWithAvatar = [
      ...this.getProperties("title", ["fontSize", "lineHeight"]),
      // Отступ слева
      {
        property: "marginLeft",
        data: this.valueArrayToDrawData(
          this.avatarSpacings,
          (v, s) => v + ParseInt(this.getValueFromArray(this.avatarSizes, s, MinMax.min)),
          (v, s) => v + ParseInt(this.getValueFromArray(this.avatarSizes, s, MinMax.max))
        )
      },
      // Ширина
      {
        property: "width",
        data: this.valueArrayToDrawData(
          this.avatarSpacings,
          (v, s) => this.containerLeftWidth - (v + ParseInt(this.getValueFromArray(this.avatarSizes, s, MinMax.min))),
          (v, s) => this.containerWidth - (v + ParseInt(this.getValueFromArray(this.avatarSizes, s, MinMax.max)))
        )
      }
    ];
    // Заголовок: с аватаркой и кнопкой
    this.titleWithBackButtonAndAvatar = [
      ...this.getProperties("title", ["fontSize", "lineHeight"]),
      // Отступ слева
      this.mixProperties({ avatarWithBackButton: ["width", "left"] }, "marginLeft", (d, s) => {
        const data: CustomObject<DrawDataPeriod> = d.avatarWithBackButton;
        const min: number = ParseInt(data.width.min) + ParseInt(data.left.min) + ParseInt(this.getValueFromArray(this.avatarSpacings, s, MinMax.min));
        const max: number = ParseInt(data.width.max) + ParseInt(data.left.max) + ParseInt(this.getValueFromArray(this.avatarSpacings, s, MinMax.max));
        // Вернуть данные
        return { min, max, unit: "px" };
      }),
    ];
    // Заголовок: с аватаркой и кнопкой: ширина
    this.titleWithBackButtonAndAvatar = [
      ...this.getProperties("titleWithBackButtonAndAvatar", ["fontSize", "lineHeight", "marginLeft"]),
      // Ширина
      this.mixProperties({ titleWithBackButtonAndAvatar: ["marginLeft"] }, "width", (d, s) => {
        const data: DrawDataPeriod = d.titleWithBackButtonAndAvatar["marginLeft"];
        const min: number = this.containerLeftWidth - ParseInt(data.min);
        const max: number = this.containerWidth - ParseInt(data.max);
        // Вернуть данные
        return { min, max, unit: "px" };
      })
    ];
  }

  // Заполнение данных: заголовок
  private static dataRenderSubTitle(): void {
    // Подзаголовок:
    this.subtitle = [
      ...this.getProperties("title", ["width", "marginLeft"]),
      // Размер шрифта
      {
        property: "fontSize",
        data: this.valueArrayToDrawData(this.subTitlesLineHeights, v => v * 0.77, v => v * 0.77)
      },
      // Высота строки
      {
        property: "lineHeight",
        data: this.valueArrayToDrawData(this.subTitlesLineHeights)
      },
      // Высота
      {
        property: "maxHeight",
        data: this.valueArrayToDrawData(this.subTitlesLineHeights, v => v, v => v * this.getSubTitleLines)
      },
      // Количество линий
      {
        property: "-webkit-line-clamp",
        data: { default: { min: 1, max: this.getSubTitleLines } }
      },
    ];
    // Подзаголовок: с кнопкой меню или назад
    this.subtitleWithBackButton = [
      ...this.getProperties("subtitle", ["fontSize", "lineHeight", "maxHeight", "-webkit-line-clamp"]),
      ...this.getProperties("titleWithBackButton", ["width", "marginLeft"])
    ];
    // Подзаголовок: с аватаркой
    this.subtitleWithAvatar = [
      ...this.getProperties("subtitle", ["fontSize", "lineHeight", "maxHeight", "-webkit-line-clamp"]),
      ...this.getProperties("titleWithAvatar", ["width", "marginLeft"])
    ];
    // Подзаголовок: с аватаркой и кнопкой
    this.subtitleWithBackButtonAndAvatar = [
      ...this.getProperties("subtitle", ["fontSize", "lineHeight", "maxHeight", "-webkit-line-clamp"]),
      ...this.getProperties("titleWithBackButtonAndAvatar", ["width", "marginLeft"])
    ];
  }

  // Заполнение данных: динамичные данные
  static dataRender(): void {
    this.dataRenderBase();
    this.dataRenderFloatingButton();
    this.dataRenderMenu();
    this.dataRenderAvatar();
    this.dataRenderTitle();
    this.dataRenderSubTitle();
  }
}
