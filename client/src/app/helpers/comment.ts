import { YouTubeImageResolution } from "@_models/comment";

// Получение маленкого изображения для видео с YouTube
export const GetYouTubeImage = (id: string, resolution: YouTubeImageResolution = "default") => "https://img.youtube.com/vi/" + id + "/" + resolution + ".jpg";

// Получение ссылки на видео с YouTube
export const GetYouTubeLink = (id: string, startTime?: number) => "https://youtu.be/" + id + "?feature=shared" + (startTime ? "&t=" + startTime : "");
