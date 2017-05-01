'use strict';

const browserSync = require('browser-sync'),
    gulp = require('gulp'),
    path = require('path');

const conf = require('./conf');


function isOnlyChange(event) {
    return event.type === 'changed';
}


gulp.task('watch', ['scripts:watch', 'inject'], () => {
    gulp.watch([path.join(conf.paths.src, '/*.html'), 'package.json'], ['inject']);

    gulp.watch([
        path.join(conf.paths.scss, '/**/*.scss'),
    ], (event) => {
        if (isOnlyChange(event)) {
            gulp.start('styles');
        }
        else {
            gulp.start('inject');
        }
    });
});
