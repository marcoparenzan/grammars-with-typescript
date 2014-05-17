/// <reference path="PEGToken.ts" />
/// <reference path="PEGLexer.ts" />
/// <reference path="PEGProduction.ts" />
var PEGParser = (function () {
    function PEGParser(lexer) {
        this._lexer = lexer;
    }
    PEGParser.prototype._can_be = function (tokens) {
        var _this = this;
        if (this._tokens == null) {
            this._tokens = this._lexer.tokens(tokens.length);
            if (this._tokens.length < tokens.length)
                return false;
        } else {
            if (this._tokens.length < tokens.length) {
                var tt = this._lexer.tokens(tokens.length - this._tokens.length);
                tt.forEach(function (xx) {
                    return _this._tokens.push(xx);
                });
                if (this._tokens.length < tokens.length)
                    return false;
            }
        }
        var i = 0;
        while (true) {
            if (i == tokens.length)
                break;
            if (tokens[i] != this._tokens[i].name)
                return false;
            i++;
        }

        return true;
    };

    // it doesn't check anything. Use with _can_be!
    PEGParser.prototype._capture = function (n) {
        return this._tokens.splice(0, n);
    };

    PEGParser.prototype.parse = function () {
    };
    return PEGParser;
})();
