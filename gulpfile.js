const gulp = require("gulp");
const pug = require("gulp-pug");
const sass = require("gulp-sass")(require("sass"));
const cleanCSS = require("gulp-clean-css");
const browserSync = require("browser-sync").create(); //  Для LiveReload
const data = require("gulp-data"); // Для передачи данных в Pug
const babel = require("gulp-babel"); // Для преобразования ES6+ в ES5 (используется для совместимости со старыми браузерами)
const uglify = require("gulp-uglify"); // Для минификации (сжатия) JavaScript
const sourcemaps = require("gulp-sourcemaps"); // Для генерации sourcemap
const fs = require("fs");

const paths = {
  pug: {
    src: "src/pug/*.pug",
    dest: "docs",
  },
  sass: {
    src: "src/sass/**/*.scss",
    dest: "docs",
  },
  data: "./data/guides.json",
  fonts: {
    src: "node_modules/@fortawesome/fontawesome-free/webfonts/*.*",
    dest: "docs/fonts/", // Destination for Font Awesome fonts
  },
  js: {
    src: "src/js/*.js", // Путь к вашим исходным JavaScript файлам (например, src/js/main.js)
    dest: "docs/js", // Папка, куда будут сохранены скомпилированные файлы (например, dist/js/)
  },
};

function loadData() {
  try {
    const fileContent = fs.readFileSync(paths.data, "utf8");
    const data = JSON.parse(fileContent); // Используем JSON.parse
    return data;
  } catch (error) {
    console.error("Ошибка при загрузке данных:", error);
    return {};
  }
}
function compilePug() {
  // compileSass();
  return gulp
    .src(paths.pug.src)
    .pipe(
      data(async function () {
        return loadData();
      })
    ) // Вот здесь передаются данные
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(browserSync.stream());
}
function compileFonts() {
  return gulp
    .src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest))
    .pipe(browserSync.stream());
}
function compileSass() {
  return gulp
    .src(paths.sass.src)
    .pipe(sass().on("error", sass.logError))
    .pipe(cleanCSS({ compatibility: "ie8" })) // Сжимаем CSS (
    .pipe(gulp.dest(paths.sass.dest))
    .pipe(browserSync.stream()); // Обновляем браузер после компиляции
}
function compileJS() {
  return gulp
    .src(paths.js.src) // Получаем исходные файлы
    .pipe(sourcemaps.init()) // Инициализируем генерацию sourcemap
    .pipe(
      babel({
        // Преобразуем ES6+ код в ES5
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(uglify()) // Минифицируем (сжимаем) JavaScript
    .pipe(sourcemaps.write(".")) // Записываем sourcemap в ту же папку (или в отдельную, если указать путь)
    .pipe(gulp.dest(paths.js.dest)); // Сохраняем скомпилированные файлы в папку назначения
}

// Задача для запуска BrowserSync
function serve() {
  browserSync.init({
    server: {
      baseDir: "dist",
    },
    notify: true,
    open: true, // Не открывать браузер автоматически
  });
}

function watchFiles() {
  gulp.watch("src/pug/**/*.pug", compilePug); // Следим за файлами Pug
  gulp.watch(paths.sass.src, compileSass); // Следим за файлами Sass
  gulp.watch(paths.data, compilePug); // Следим за файлом данных (JSON)
  gulp.watch(paths.fonts.src, compileFonts);
  gulp.watch(paths.js.src, compileJS);
}
const build = gulp.series(compilePug, compileSass, compileFonts, compileJS);
const watchTask = gulp.parallel(watchFiles, serve); // Запускаем watchFiles и serve параллельно

// Экспорт задач
exports.build = build;
exports.default = gulp.series(build, watchTask); // Сначала build, потом watch
