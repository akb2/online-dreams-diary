// Получение маленкого изображения для видео с YouTube
export const GetYouTubeSmallImage = (id: string) => "https://img.youtube.com/vi/" + id + "/default.jpg";

// Получение ссылки на видео с YouTube
export const GetYouTubeLink = (id: string, startTime?: number) => "https://youtu.be/" + id + "?feature=shared" + (startTime ? "&t=" + startTime : "");
