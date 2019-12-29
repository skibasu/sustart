// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp");

// Importing all the Gulp-related packages we want to use

const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const browserify = require("browserify");
const babelify = require("babelify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const injectSvg = require("gulp-inject-svg");
const uglify = require("gulp-uglify");
const autoprefixer = require("gulp-autoprefixer");
const newer = require("gulp-newer");
const imagemin = require("gulp-imagemin");
const del = require("del");
const htmlPartial = require("gulp-html-partial");

const browserSync = require("browser-sync").create();
const { stream, reload } = browserSync;

// files

const files = {
    // dist
    dist: "dist/",

    // scss css
    styleFile: "./src/assets/scss/index.scss",
    styleAllFiles: "src/assets/scss/**/*.scss",
    cssDistPath: "dist/assets/css/",

    // js
    js__FILES: ["app.js"],
    jsSrcPath: "./src/assets/js/",
    jsAllFiles: "src/assets/js/**/*.js",
    jsDistPath: "dist/assets/js/",

    // img
    imagesAllFiles: "src/assets/images/**/*.*",
    imagesDistPath: "dist/assets/images/",

    // html
    htmlRootFiles: "src/*.html",
    htmlAllFiles: "src/**/*.html",
    htmlDistPath: "dist/*.html",
    htmlPartsPath: "src/parts/"
};

// Browser sync task
const browserSyncTask = () =>
    browserSync.init({
        server: {
            baseDir: "./dist/"
        }
    });
// Sass task

const scssTask = () => {
    return src(files.styleFile)
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                errLogToConsole: true,
                outputStyle: "compressed"
            })
        )
        .on("error", console.error.bind(console))
        .pipe(
            autoprefixer({
                cascade: false
            })
        )
        .pipe(rename({ suffix: ".min" }))
        .pipe(sourcemaps.write("."))
        .pipe(dest(files.cssDistPath))
        .pipe(stream());
};

// JS task

const jsTask = d => {
    files.js__FILES.map(entry =>
        browserify({ entries: [files.jsSrcPath + entry] })
            .transform(babelify, {
                presets: ["@babel/preset-env"]
            })
            .bundle()
            .pipe(source(entry))
            .pipe(rename({ suffix: ".min" }))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(uglify())
            .pipe(sourcemaps.write("."))
            .pipe(dest(files.jsDistPath))
    );
    d();
};

// Images task

const imagesTask = () =>
    src(files.imagesAllFiles)
        .pipe(newer(files.imagesDistPath))
        .pipe(
            imagemin([
                imagemin.gifsicle({ interlaced: true }),
                imagemin.jpegtran({ progressive: true }),
                imagemin.optipng({ optimizationLevel: 5 }),
                imagemin.svgo({
                    plugins: [{ cleanupIDs: true }, { removeViewBox: false }]
                })
            ])
        )
        .pipe(dest(files.imagesDistPath));

// partialTask

const partialTask = () =>
    src(files.htmlRootFiles)
        .pipe(
            htmlPartial({
                basePath: files.htmlPartsPath,
                tagName: "include"
            })
        )
        .pipe(dest(files.dist));

const svgTask = () =>
    src(files.htmlDistPath)
        .pipe(injectSvg({ base: "src/assets/images/svg/" }))
        .pipe(dest(files.dist));

// Clean task

const cleanAllTask = () => del([`dist/*`]);

// Watch task

const watchTask = () => {
    watch(files.styleAllFiles, scssTask);
    watch(files.jsAllFiles, jsTask).on("change", reload);
    watch(files.imagesAllFiles, imagesTask).on("change", reload);
    watch(files.htmlAllFiles, series(partialTask, svgTask)).on(
        "change",
        reload
    );
};

// Default task

exports.default = series(
    cleanAllTask,
    parallel(scssTask, jsTask, imagesTask, partialTask),
    svgTask,
    parallel(watchTask, browserSyncTask)
);
