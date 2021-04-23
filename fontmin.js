const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk')
const rimraf = require('rimraf');
const resolve = dir => path.join(__dirname, dir);
const Fontmin = require('fontmin');
const fontCSSPath = resolve('../public/static/fonts/font.css');

const error = chalk.red;
const success = chalk.green;

function isFile(path) {
    try {
        return fs.statSync(path).isFile();
    } catch (err) {
        return false;
    }
}

function isDirectory(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch (err) {
        return false;
    }
}

const files = fs.readdirSync(resolve('.'));
rimraf.sync(fontCSSPath);
files.forEach(function (itme) {
    if (isDirectory(resolve(itme))) {
        run(resolve(itme), resolve('../public/static/fonts/' + itme + '/dist/'), itme);
    }
});

function run(src, dest, name) {
    if (isDirectory(dest)) {
        rimraf.sync(dest)
    }
    const pluginOpts = {
        hinting: false,
        deflate: true,
        text: '',
    };
    const fontTextPath = src + '/font.text';
    if (!isFile(fontTextPath)) {
        return;
    }

    //去除空格换行
    const text = fs.readFileSync(src + '/font.text', 'utf-8').replace(/\s+/g, "").replace(/[\n\r]/g, "");
    //去重
    pluginOpts.text = [].filter.call(text, function (s, i, o) {
        return o.indexOf(s) == i;
    }).join('');

    const fontmin = new Fontmin()
        .src([src + '/*.ttf'])
        .use(Fontmin.glyph(pluginOpts))
        .use(Fontmin.ttf2woff(pluginOpts))
        .dest(dest);
    fontmin.run(function (err) {
        if (err) {
            throw err;
        }
        if (!isDirectory(dest)) {
            return console.log(error(`${name} complete error`));
        }
        const files = fs.readdirSync(dest);
        let fontCss = '';
        files.forEach(function (itme, index) {
            const fontPath = dest + itme;
            if (itme.indexOf('.woff') > -1) {
                const buffer = fs.readFileSync(fontPath);
                const fsHash = crypto.createHash('md5');
                fsHash.update(buffer);
                const hash = fsHash.digest('hex').substring(0, 8);
                const extname = path.extname(fontPath);
                const basename = path.basename(fontPath).replace(extname, '');
                const newFontName = `${basename}.${hash}${extname}`;
                fs.copyFileSync(fontPath, dest + newFontName);
                fontCss = `@font-face {
	font-family: '${name}';
	src: url("./${name}/dist/${newFontName}") format('woff');
	font-style: normal;
	font-weight: normal;
	font-display: swap;
}\n\n`;
            }
            fs.unlinkSync(fontPath);
        });
        if (!isFile(fontCSSPath)) {
            fs.writeFileSync(fontCSSPath, fontCss, 'utf8');
        } else {
            fs.appendFileSync(fontCSSPath, fontCss, 'utf8');
        }
        console.log(success(`${name} complete success`));
    });
}

