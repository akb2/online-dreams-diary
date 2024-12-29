import { ObjectToStringParams } from "@_datas/api";
import { YouTubeImageResolution, YouTubeVideo } from "@_models/comment";

// Получение маленкого изображения для видео с YouTube
export const GetYouTubeImage = (id: string, resolution: YouTubeImageResolution = "default") => "https://img.youtube.com/vi/" + id + "/" + resolution + ".jpg";

// Получение ссылки на видео с YouTube
export const GetYouTubeLink = (id: string, startTime?: number) => "https://youtu.be/" + id + "?feature=shared" + (startTime ? "&t=" + startTime : "");

// Получение ссылки на видео с YouTube для встраивания
export const GetYouTubeEmbedLink = (youTubeVideo: YouTubeVideo, autoplay = false) => (
  "https://www.youtube.com/embed/" + youTubeVideo.id + "?" +
  ObjectToStringParams({
    start: youTubeVideo.startTime,
    autoplay,
    controls: 1,
    loop: 0
  })
);
