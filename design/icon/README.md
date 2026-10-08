# AntiLate — runner / clock

## Подключённая иконка

Утверждённый источник: `antilate-final-icon.svg`. Используется только видимая
монтажная область: бегун на коричневой подложке. Исходный экспорт Illustrator
сохранён; дополнительные рисунки за пределами viewBox не входят в PNG.

В `app.json` подключены:

- `assets/antilate-icon.png` — обычная иконка 1024 × 1024, без прозрачности;
- `assets/antilate-adaptive-foreground.png` — Android foreground с прозрачностью
  и отступами для безопасной области;
- `assets/antilate-monochrome.png` — прозрачная маска бегуна для themed icons;
- `assets/antilate-favicon.png` — favicon.

Фон: `#FFFDFC`. Превью круглой Android-иконки:
`antilate-android-preview.png`. Старые варианты ниже сохранены для истории.

Генератор: `scripts/generate-app-icons.cjs`. Для повторной генерации нужен sharp:
`ANTILATE_SHARP_MODULE=/absolute/path/to/sharp node scripts/generate-app-icons.cjs`.
Готовые PNG входят в проект; EAS не запускает генератор и sharp для сборки не нужен.

## Вариант 2 — ближе к зарисовке

`antilate-runner-clock-angular.svg` — более острые стрелки с наклоном,
плечевой пояс, сужение талии, угловатые сгибы конечностей и отдельные силуэты
кроссовок. `antilate-runner-clock-angular.svg.png` — его превью.
Первый вариант ниже сохранён без изменений.

Векторный вариант по авторской зарисовке: бегущий человек на двух стрелках часов.

- `antilate-runner-clock.svg` — редактируемый вектор, 1024 × 1024.
- `antilate-runner-clock.svg.png` — превью того же SVG, 1024 × 1024.
- Силуэт и стрелки: `#1C1A19`; фон: `#FFFDFC` из светлой темы AntiLate.
- Именованные элементы: фон, стрелки и фигура. Шрифтов и растровых вставок нет.
- Белый контур под силуэтом отделяет человека от стрелок.

SVG можно открыть в Illustrator. Это согласовательный исходник, не подключённый
к приложению. После утверждения потребуются отдельный прозрачный foreground
для Android adaptive icon и проверка safe zone на круглой и других масках.
