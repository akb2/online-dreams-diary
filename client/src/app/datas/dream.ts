import { OptionData } from "@_models/form";
import { SimpleObject } from "@_models/app";
import { DreamMode, DreamMood, DreamStatus, DreamType } from "@_models/dream";





// Префикс для картинок типа сновидений
const DreamTypeImagePreffix: string = "/assets/images/icons/dream-type/";

// Префикс для картинок настроения сновидений
const DreamMoodImagePreffix: string = "/assets/images/icons/dream-mood/";

// Набор методов для типа сновидения
export const DreamModes: OptionData[] = [
  // В виде текста
  {
    key: DreamMode.text.toString(),
    title: "В виде текста",
    icon: "notes",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // В виде карты
  {
    key: DreamMode.map.toString(),
    title: "В виде карты",
    icon: "explore",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // В виде карты и описания
  {
    key: DreamMode.mixed.toString(),
    title: "В виде карты и описания",
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
    title: "Черновик",
    subTitle: "Доступно только для вас",
    icon: "drive_file_rename_outline",
    iconColor: "disabled",
    iconBackground: "fill"
  },
  // Личное сновидение
  {
    key: DreamStatus.private.toString(),
    title: "Личное сновидение",
    subTitle: "Доступно только для вас",
    icon: "lock",
    iconColor: "warn",
    iconBackground: "fill"
  },
  // Для друзей
  {
    key: DreamStatus.friends.toString(),
    title: "Для друзей",
    subTitle: "Доступно для списка друзей и подписок",
    icon: "group",
    iconColor: "accent",
    iconBackground: "fill"
  },
  // Для сообщества
  {
    key: DreamStatus.users.toString(),
    title: "Для сообщества",
    subTitle: "Доступно всем пользователям сервиса",
    icon: "vpn_lock",
    iconColor: "accent",
    iconBackground: "fill"
  },
  // По ссылке
  {
    key: DreamStatus.hash.toString(),
    title: "По ссылке",
    subTitle: "Доступно по специальной ссылке",
    icon: "link",
    iconColor: "primary",
    iconBackground: "fill"
  },
  // Публичное сновидение
  {
    key: DreamStatus.public.toString(),
    title: "Публичное сновидение",
    subTitle: "Доступно всем в интернете",
    icon: "travel_explore",
    iconColor: "primary",
    iconBackground: "fill"
  }
];

// Информация о типах сновидений
export const DreamTypes: OptionData[] = [
  // Обычное сновидение
  {
    key: DreamType.Simple.toString(),
    title: "Обычное сновидение",
    subTitle: "В этом сновидении не произошло ничего, что можно было отнести к другим категориям.",
    image: "simple",
    iconColor: "disabled"
  },
  // Сплошная болтовня
  {
    key: DreamType.Chatter.toString(),
    title: "Сплошная болтовня",
    subTitle: "В этом типе мало активных действий, мало сведений о ландшафте, но много диалогов.",
    image: "chatter",
    iconColor: "accent"
  },
  // Полнейший бред
  {
    key: DreamType.Drivel.toString(),
    title: "Полнейший бред",
    subTitle: "Данным типом помечайте даже те сновидения, которые являются бредом для сновидения.",
    image: "drivel",
    iconColor: "accent"
  },
  // Эпичное
  {
    key: DreamType.Epic.toString(),
    title: "Эпичное",
    subTitle: "В данный тип входят сновидения о космических битвах или других грандиозных событиях снов.",
    image: "epic",
    iconColor: "warn"
  },
  // Осознанное сновидение
  {
    key: DreamType.Lucid.toString(),
    title: "Осознанное сновидение",
    subTitle: "В данный тип входят ОС'ы или так называемые \"ВТО\".",
    image: "lucid",
    iconColor: "primary"
  },
]
  .map(option => ({
    ...option,
    image: DreamTypeImagePreffix + option.image + ".png",
    imagePosition: "contain",
    iconBackground: "fill"
  } as OptionData));

// Информация о настроении сновидений
export const DreamMoods: OptionData[] = [
  // Ночной кошмар
  {
    key: DreamMood.Nightmare.toString(),
    title: "Ночной кошмар",
    subTitle: "В это настроение входят: погони от монстров, сонные параличи и т.д.",
    image: "nightmare",
    iconColor: "warn"
  },
  // Мрачный сон
  {
    key: DreamMood.Gloomy.toString(),
    title: "Мрачный сон",
    subTitle: "Отличается тем, что явной угрозы нет, но чувствуется присутствие чего-то угрожающего. Обычно картинка темная/черно-белая или не включается свет.",
    image: "gloomy",
    iconColor: "accent"
  },
  // Грустный сон
  {
    key: DreamMood.Sad.toString(),
    title: "Грустный сон",
    subTitle: "Тут может обычная повседневность, но события показывают потерю близких или другие сильные негативные эмоции.",
    image: "sad",
    iconColor: "accent"
  },
  // Непримечательный сон
  {
    key: DreamMood.Nothing.toString(),
    title: "Непримечательный сон",
    subTitle: "Сюжет сна не вызвал в вас сильной эмоцианальной отдачи.",
    image: "nothing",
    iconColor: "disabled"
  },
  // Веселый сон
  {
    key: DreamMood.Joy.toString(),
    title: "Веселый сон",
    subTitle: "Такие сюжеты могут вызвать либо смех, либо эмоцианальной подъем и вдохновение.",
    image: "joy",
    iconColor: "primary"
  },
  // Филосовский сон
  {
    key: DreamMood.Philosophy.toString(),
    title: "Филосовский сон",
    subTitle: "После таких сновидений мы можете годами обдумывать смысл жизни/мироустройство/ваше место в мире.",
    image: "philosophy",
    iconColor: "primary"
  },
]
  .map(option => ({
    ...option,
    image: DreamMoodImagePreffix + option.image + ".png",
    imagePosition: "contain",
    iconBackground: "fill"
  } as OptionData))

// Склонение количества сновидений
export const DreamPlural: SimpleObject = {
  "=0": "",
  "=1": "# сновидение",
  "few": "# сновидения",
  "other": "# сновидений"
};
