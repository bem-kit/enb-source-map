
/**
 * Main surcemap helper
 */

// Source Map Generator
var mozilla = require('source-map');
var SourceMapGenerator = mozilla.SourceMapGenerator;

var btoa = require('btoa');
var utils = require('./utils');
var getSourceMap = utils.getSourceMap;
var removeBuiltInSourceMap = utils.removeBuiltInSourceMap;

var SOURCE_MAPPING_URL_COMMENT = '//# sourceMappingURL=data:application/json;base64,';

function BundleGenerator(filename, useSourceMap) {

    this._content = [''];

    if (useSourceMap) {
        this._map = new SourceMapGenerator({file: filename});
    }

    this._filename = filename;

}

BundleGenerator.prototype = {

    /**
     * Add to map script component content.
     * The most important method
     */
    writeFileContent: function (filename, content) {
        this._writeFileFragment(filename, content, 1, 0);
        this._content.push('');
    },

    /**
     * Add to map addition comments and so on
     * @param {String} line
     */
    writeLine: function (line) {
        this._write(line + '\n');
    },

    /**
     * Add to map addition multiline comments and so on
     * @param {String} content
     */
    writeContent: function (content) {
        this._write(content + '\n');
    },

    /**
     * Add to map raw text
     * @private
     * @param {String} content
     */
    _write: function (content) {
        var lines = _getLines(String(content));
        this._content[this._content.length - 1] += lines.shift();
        this._content = this._content.concat(lines);
    },

    /**
     * Add to map raw file content
     * @private
     */
    _writeFileFragment: function (filename, content, lineNumber, column) {
        var lines = _getLines(content);
        var subSourceMap;
        if (this._map) {
            subSourceMap = getSourceMap(lines);
        }

        lines = removeBuiltInSourceMap(lines);
        var lastLineNum = lines.length - 1;
        lines.forEach(function (line, i) {
            if (this._map) {
                this._map.addMapping({
                    source: filename,
                    original: {line: lineNumber + i, column: i === 0 ? column : 0},
                    generated: {line: this._content.length, column: i === 0 ? this.getCursor().column : 0}
                });
            }
            if (i === lastLineNum) {
                this._write(line);
            } else {
                this.writeLine(line);
            }
        }, this);

        if (this._map && subSourceMap) {
            this._map.applySourceMap(
                subSourceMap,
                filename
            );
        }
    },

    /**
     * Get position in concatenated file
     */
    getCursor: function () {
        return {
            line: this._content.length,
            column: this._content[this._content.length - 1].length
        };
    },

    /**
     * Return concatenated file with sourcemap
     */
    render: function () {
        var lines = this._content.concat();
        if (this._map) {
            if (lines[lines.length - 1] === '') {
                lines.pop();
            }
            lines = lines.concat(SOURCE_MAPPING_URL_COMMENT + btoa(this._map.toString()));
        }
        return lines.join('\n');
    }

};

/**
 * Split text string into lines array
 * @param {String} text
 * @private
 */
function _getLines(text) {
    return text.split(/\r\n|\r|\n/);
}

module.exports = BundleGenerator;
