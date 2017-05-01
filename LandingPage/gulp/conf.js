'use strict';

const gutil = require('gulp-util');

exports.paths = {
    gulp: 'gulp',
    scss: 'scss',
    src: 'src',
    tmp: '.tmp',
};

exports.errorHandler = (title) =>
    (err) => {
        gutil.log(gutil.colors.red(`[${title}]`), err.toString());

        this.emit('end');
    };
