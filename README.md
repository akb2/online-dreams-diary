# Online Dreams Diary
Общее описание и рекомендации по сборке

## Бекенд
Бэкэнд запускается непосредственно на сервере. Для этого переносим папку `/api` в корневую папку HTTP сервера, тоже самое можно сделать для тестового сервера, аналогично проделываем для структуры папок `/media`. Так же копируем файлы конфигураций **nginx** из папки `/nginx-settings` в соответсвующую папку настроек веб-серверов.

## Конфигурация фронтенда
### development
Запускает фронтенд без оптимизаций и map файлов, все запросы направляются к тестовым API и Media серверам, запускает сторонние библиотеки (напр. как ReCaptcha) в тестовом режиме.

### production
В таком варианте все файлы компилируются и максимально оптимизируются. Все запросы направляются к рабочим серверам Api и Media. Все сторонние модули запускаются в рабочем режиме.

### cypress
Специальный режим тестирования для ПО CyPress. Файлы собираются как для **production**, но запросы направляются на тестовые сервера. Так же для этого режима отключается отправка почтовых писем и некоторые сторонние библиотеки, требующие "человечного" поведения, отключаются (напр. ReCaptcha).