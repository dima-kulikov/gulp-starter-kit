/*
 * Gulp Project Boilerplate, Copyright © 2017, Alexander Repeta <axzerk@gmail.com>
 */
const gulp = require("gulp");
const del = require("del");
const runSequence = require("run-sequence");
const browserSync = require("browser-sync");
const autoprefixer = require("autoprefixer");
const swPrecache = require("sw-precache");

const $ = require("gulp-load-plugins")();

// const cache = require("gulp-cache");
// const cached = require("gulp-cached");

/*
 * Project paths
 */
const paths = {
  src: {
    html: "src/*.html",
    js: "src/js/common.js",
    scss: "src/scss/styles.scss",
    img: "src/img/**/*.{png,jpg,jpeg,svg}",
    fonts: "src/fonts/**/*.{woff,woff2}",
    manifest: "src/manifest.json"
  },
  build: {
    html: "build",
    js: "build/scripts",
    css: "build/styles",
    img: "build/images",
    fonts: "build/fonts",
    manifest: "build"
  },
  watch: {
    html: "src/**/*.html",
    scss: "src/scss/**/*.scss",
    js: "src/js/**/*.js"
  },
  clean: "build"
};

/*
 * Assembling .scss files
 */
gulp.task("dev:styles", () =>
  gulp
    .src(paths.src.scss)
    .pipe($.sourcemaps.init())
    .pipe($.sass({ precision: 10 }))
    .on(
      "error",
      $.notify.onError({
        title: "SCSS",
        message: "<%= error.message %>"
      })
    )
    .pipe($.postcss([autoprefixer()]))
    .pipe($.mergeMediaQueries({ log: false }))
    .pipe(gulp.dest(paths.build.css))
    .pipe($.cssnano())
    .pipe($.size({ title: "styles" }))
    .pipe($.rename("styles.min.css"))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(paths.build.css))
);

gulp.task("prod:styles", () =>
  gulp
    .src(paths.src.scss)
    .pipe($.sass())
    .pipe($.postcss([autoprefixer()]))
    .pipe($.mergeMediaQueries({ log: false }))
    .pipe(gulp.dest(paths.build.css))
    .pipe($.cssnano())
    .pipe($.size({ title: "styles" }))
    .pipe($.rename("styles.min.css"))
    .pipe($.cacheBust({ type: "timestamp" }))
    .pipe(gulp.dest(paths.build.css))
);

/*
 * Assembling .html files
 */
gulp.task("dev:html", () =>
  gulp
    .src(paths.src.html)
    .pipe($.cached("html"))
    .pipe($.rigger())
    .on(
      "error",
      $.notify.onError({
        title: "HTML",
        message: "<%= error.message %>"
      })
    )
    .pipe(gulp.dest(paths.build.html))
);

gulp.task("prod:html", () =>
  gulp
    .src(paths.src.html)
    .pipe($.rigger())
    .pipe(
      $.htmlmin({
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeOptionalTags: true
      })
    )
    .pipe($.cacheBust({ type: "timestamp" }))
    .pipe($.size({ title: "html", showFiles: true }))
    .pipe(gulp.dest(paths.build.html))
);

/*
 * Assembling .js files
 */
gulp.task("dev:scripts", () =>
  gulp
    .src(paths.src.js)
    .pipe(
      $.plumber({
        errorHandler: $.notify.onError({
          title: "JS",
          message: "<%= error.message %>"
        })
      })
    )
    .pipe(
      $.fileInclude({
        prefix: "@@",
        basepath: "@file"
      })
    )
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write())
    .pipe($.uglify())
    .pipe($.rename("scripts.min.js"))
    .pipe($.sourcemaps.write("."))
    .pipe(gulp.dest(paths.build.js))
);

gulp.task("prod:scripts", () =>
  gulp
    .src(paths.src.js)
    .pipe(
      $.fileInclude({
        prefix: "@@",
        basepath: "@file"
      })
    )
    .pipe($.babel())
    .pipe($.uglify())
    .pipe($.size({ title: "scripts" }))
    .pipe($.rename({ suffix: ".min" }))
    .pipe(gulp.dest(paths.build.js))
);

/*
 * Optimizing and caching images
 */
gulp.task("images", () =>
  gulp
    .src(paths.src.img)
    .pipe(
      $.imagemin([
        $.imagemin.jpegtran({ progressive: true }),
        $.imagemin.optipng({ optimizationLevel: 3 }),
        $.imagemin.svgo({
          plugins: [{ removeViewBox: false }, { cleanupIDs: false }]
        })
      ])
    )
    .pipe($.cached("images"))
    .pipe(gulp.dest(paths.build.img))
    .pipe($.size({ title: "images" }))
);

/*
 * Assembling fonts
 */
gulp.task("fonts", () =>
  gulp.src(paths.src.fonts).pipe(gulp.dest(paths.build.fonts))
);

/*
 * Assembling manifest
 */
gulp.task("prod:manifest", () =>
  gulp.src(paths.src.manifest).pipe(gulp.dest(paths.build.manifest))
);

/*
 * Creating a Service Worker
 */
gulp.task("serviceWorker", () => {
  swPrecache.write(`./build/service-worker.js`, {
    staticFileGlobs: [
      "./build/manifest.json",
      "./build/**/*.html",
      "./build/styles/*.min.css",
      "./build/fonts/**/*",
      "./build/images/**/*",
      "./build/scripts/*.min.js"
    ],
    stripPrefix: `./src`
  });
});

/*
 * Watching for file changes in ./src
 */
gulp.task("dev:watch", () => {
  gulp.watch(paths.watch.html, ["dev:html", browserSync.reload]);
  gulp.watch(paths.watch.scss, ["dev:styles", browserSync.reload]);
  gulp.watch(paths.watch.js, ["dev:scripts", browserSync.reload]);
});

/*
 * BrowserSync web-server
 */
gulp.task("dev:server", () =>
  browserSync.init({
    server: {
      baseDir: "./build"
    },
    host: "localhost",
    port: 3000,
    logPrefix: "DevServer",
    notify: false,
    open: true,
    cors: true,
    ui: false
  })
);

/*
 * Cleaning ./build dir
 */
gulp.task("clean:build", () => del(paths.clean));

/*
 * Cleaning cache
 */
gulp.task("clean:cache", () => $.cache.clearAll());

/*
 * Removing repository specific files
 */
gulp.task("prepare", () => del(["**/.gitkeep", "README.md"]));

/*
 * Building for development
 */
gulp.task("dev:build", cb =>
  runSequence(
    "clean:build",
    "clean:cache",
    "images",
    "fonts",
    "dev:styles",
    "dev:scripts",
    "dev:html",
    "dev:server",
    "dev:watch",
    cb
  )
);

/*
 * Building for production
 */
gulp.task("prod:build", cb =>
  runSequence(
    "clean:build",
    "clean:cache",
    "images",
    "fonts",
    "prod:manifest",
    "prod:styles",
    "prod:scripts",
    "prod:html",
    "serviceWorker",
    cb
  )
);
