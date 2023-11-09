import { SimpleObject } from "@_models/app";
import { DreamMode, DreamMood, DreamStatus, DreamType } from "@_models/dream";
import { OptionData } from "@_models/form";





// Функция для заполнения массива пунктов меню
const OptionDataFill = (imagePreffix: string, optionData: OptionData[]): OptionData[] => optionData.map(option => ({
  ...option,
  image: imagePreffix + option.image + ".png",
  imagePosition: "contain",
  iconBackground: "fill"
}));





// Префикс для картинок типа сновидений
const DreamTypeImagePreffix: string = "/assets/images/icons/dream-type/";

// Префикс для картинок настроения сновидений
const DreamMoodImagePreffix: string = "/assets/images/icons/dream-mood/";

// Набор методов для типа сновидения
export const DreamModes: OptionData[] = [
  // В виде текста
  {
    key: DreamMode.text.toString(),
    title: "general.option_data.dream.mode.text",
    icon: "notes",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // В виде карты
  {
    key: DreamMode.map.toString(),
    title: "general.option_data.dream.mode.map",
    icon: "explore",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // В виде карты и описания
  {
    key: DreamMode.mixed.toString(),
    title: "general.option_data.dream.mode.mixed",
    icon: "library_books",
    iconColor: "primary",
    iconBackground: "fill"
  }
];

// Набор методов для статуса сновидения
export const DreamStatuses: OptionData[] = [
  // Черновик
  {
    key: DreamStatus.draft.toString(),
    title: "general.option_data.dream.status.draft.title",
    subTitle: "general.option_data.dream.status.draft.subTitle",
    icon: "drive_file_rename_outline",
    iconColor: "disabled",
    iconBackground: "fill"
  },
  // Личное сновидение
  {
    key: DreamStatus.private.toString(),
    title: "general.option_data.dream.status.private.title",
    subTitle: "general.option_data.dream.status.private.subTitle",
    icon: "lock",
    iconColor: "warn",
    iconBackground: "fill"
  },
  // Для друзей
  {
    key: DreamStatus.friends.toString(),
    title: "general.option_data.dream.status.friends.title",
    subTitle: "general.option_data.dream.status.friends.subTitle",
    icon: "group",
    iconColor: "accent",
    iconBackground: "fill"
  },
  // Для сообщества
  {
    key: DreamStatus.users.toString(),
    title: "general.option_data.dream.status.users.title",
    subTitle: "general.option_data.dream.status.users.subTitle",
    icon: "vpn_lock",
    iconColor: "accent",
    iconBackground: "fill"
  },
  // По ссылке
  {
    key: DreamStatus.hash.toString(),
    title: "general.option_data.dream.status.hash.title",
    subTitle: "general.option_data.dream.status.hash.subTitle",
    icon: "link",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // Публичное сновидение
  {
    key: DreamStatus.public.toString(),
    title: "general.option_data.dream.status.public.title",
    subTitle: "general.option_data.dream.status.public.subTitle",
    icon: "travel_explore",
    iconColor: "primary",
    iconBackground: "fill"
  }
];

// Информация о типах сновидений
export const DreamTypes: OptionData[] = OptionDataFill(DreamTypeImagePreffix, [
  // Обычное сновидение
  {
    key: DreamType.Simple.toString(),
    title: "general.option_data.dream.type.simple.title",
    subTitle: "general.option_data.dream.type.simple.subTitle",
    image: "simple",
    iconColor: "disabled"
  },
  // Сплошная болтовня
  {
    key: DreamType.Chatter.toString(),
    title: "general.option_data.dream.type.chatter.title",
    subTitle: "general.option_data.dream.type.chatter.subTitle",
    image: "chatter",
    iconColor: "accent"
  },
  // Полнейший бред
  {
    key: DreamType.Drivel.toString(),
    title: "general.option_data.dream.type.drivel.title",
    subTitle: "general.option_data.dream.type.drivel.subTitle",
    image: "drivel",
    iconColor: "accent"
  },
  // Эпичное
  {
    key: DreamType.Epic.toString(),
    title: "general.option_data.dream.type.epic.title",
    subTitle: "general.option_data.dream.type.epic.subTitle",
    image: "epic",
    iconColor: "warn"
  },
  // Осознанное сновидение
  {
    key: DreamType.Lucid.toString(),
    title: "general.option_data.dream.type.lucid.title",
    subTitle: "general.option_data.dream.type.lucid.subTitle",
    image: "lucid",
    iconColor: "primary"
  },
]);

// Информация о настроении сновидений
export const DreamMoods: OptionData[] = OptionDataFill(DreamMoodImagePreffix, [
  // Ночной кошмар
  {
    key: DreamMood.Nightmare.toString(),
    title: "general.option_data.dream.mood.nightmare.title",
    subTitle: "general.option_data.dream.mood.nightmare.subTitle",
    image: "nightmare",
    iconColor: "warn"
  },
  // Мрачный сон
  {
    key: DreamMood.Gloomy.toString(),
    title: "general.option_data.dream.mood.gloomy.title",
    subTitle: "general.option_data.dream.mood.gloomy.subTitle",
    image: "gloomy",
    iconColor: "accent"
  },
  // Грустный сон
  {
    key: DreamMood.Sad.toString(),
    title: "general.option_data.dream.mood.sad.title",
    subTitle: "general.option_data.dream.mood.sad.subTitle",
    image: "sad",
    iconColor: "accent"
  },
  // Непримечательный сон
  {
    key: DreamMood.Nothing.toString(),
    title: "general.option_data.dream.mood.nothing.title",
    subTitle: "general.option_data.dream.mood.nothing.subTitle",
    image: "nothing",
    iconColor: "disabled"
  },
  // Веселый сон
  {
    key: DreamMood.Joy.toString(),
    title: "general.option_data.dream.mood.joy.title",
    subTitle: "general.option_data.dream.mood.joy.subTitle",
    image: "joy",
    iconColor: "primary"
  },
  // Филосовский сон
  {
    key: DreamMood.Philosophy.toString(),
    title: "general.option_data.dream.mood.philosophy.title",
    subTitle: "general.option_data.dream.mood.philosophy.subTitle",
    image: "philosophy",
    iconColor: "primary"
  },
]);

// Склонение количества сновидений
export const DreamPlural: SimpleObject = {
  "=0": "",
  "=1": "# сновидение",
  "few": "# сновидения",
  "other": "# сновидений"
};
