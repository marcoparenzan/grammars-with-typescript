/// <reference path="PEGToken.ts" />
// http://eli.thegreenplace.net/2013/07/16/hand-written-lexer-in-javascript-compared-to-the-regex-based-ones/
var PEGLexer = (function () {
    // Initialize the Lexer's buffer. This resets the lexer's internal
    // state and subsequent tokens will be returned starting with the
    // beginning of the new buffer.
    function PEGLexer(buf) {
        // Operator table, mapping operator -> token name
        this._optable = {
            '+': 'PLUS',
            '-': 'MINUS',
            '*': 'MULTIPLY',
            '.': 'PERIOD',
            '\\': 'BACKSLASH',
            ':': 'COLON',
            '%': 'PERCENT',
            '|': 'PIPE',
            '!': 'EXCLAMATION',
            '?': 'QUESTION',
            '#': 'POUND',
            '&': 'AMPERSAND',
            ';': 'SEMI',
            ',': 'COMMA',
            '(': 'L_PAREN',
            ')': 'R_PAREN',
            '<': 'L_ANG',
            '>': 'R_ANG',
            '{': 'L_BRACE',
            '}': 'R_BRACE',
            '[': 'L_BRACKET',
            ']': 'R_BRACKET',
            '=': 'EQUALS'
        };
        this._pos = 0;
        this._row = 1;
        this._col = 1;
        this._buffer = buf;
        this._buffer_length = buf.length;
    }
    // Get the next token from the current buffer. A token is an object with
    // the following properties:
    // - name: name of the pattern that this token matched (taken from rules).
    // - value: actual string value of the token.
    // - pos: offset in the current buffer where the token starts.
    //
    // If there are no more tokens in the buffer, returns null. In case of
    // an error throws Error.
    PEGLexer.prototype.tokens = function (n) {
        var tokens = [];
        for (var i = 0; i < n; i++) {
            var t = this.token();
            if (t == null)
                break;
            tokens.push(t);
        }
        return tokens;
    };

    PEGLexer.prototype.token = function () {
        this._skipnontokens();
        if (this._pos >= this._buffer_length) {
            return null;
        }

        // The char at this.pos is part of a real token. Figure out which.
        var c = this._buffer.charAt(this._pos);

        // '/' is treated specially, because it starts a comment if followed by
        // another '/'. If not followed by another '/', it's the DIVIDE
        // operator.
        if (c === '/') {
            var next_c = this._buffer.charAt(this._pos + 1);
            if (next_c === '/') {
                return this._process_comment_one_line();
            } else if (next_c === '*') {
                return this._process_comment();
            } else {
                return { name: 'DIVIDE', value: '/', col: this._col, row: this._row, pos: this._pos_pp() };
            }
        } else if (this._isalpha(c)) {
            return this._process_identifier();
        } else if (this._isdigit(c)) {
            return this._process_number();
        } else if (c === '"') {
            return this._process_quote();
        } else if (c === '{') {
            return this._process_javascript_snippet();
        } else if ((c === '[') || (c === '\\') || (c === '(')) {
            return this._process_regular_expression();
        } else {
            // Look it up in the table of operators
            var op = this._optable[c];
            if (op !== undefined)
                return { name: op, value: c, col: this._col, row: this._row, pos: this._pos_pp() };
            else
                throw Error('Token error at ' + this._pos);
        }
    };

    PEGLexer.prototype._isnewline = function (c) {
        return c === '\r' || c === '\n';
    };

    PEGLexer.prototype._isdigit = function (c) {
        return c >= '0' && c <= '9';
    };

    PEGLexer.prototype._isalpha = function (c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
    };

    PEGLexer.prototype._isalphanum = function (c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_' || c === '$';
    };

    PEGLexer.prototype._isnotoken = function (c) {
        if (c == ' ' || c == '\t') {
            return true;
        } else if (c == '\r') {
            return true;
        } else if (c == '\n') {
            return true;
        }
        return false;
    };

    PEGLexer.prototype._process_number = function () {
        var endpos = this._pos + 1;
        while (endpos < this._buffer_length && this._isdigit(this._buffer.charAt(endpos))) {
            endpos++;
        }

        var tok = {
            name: 'NUMBER',
            value: this._buffer.substring(this._pos, endpos),
            pos: this._pos,
            row: this._row,
            col: this._col
        };
        this._pos = endpos;
        return tok;
    };

    PEGLexer.prototype._process_regular_expression = function () {
        var endpos = this._pos + 1;

        while (true) {
            var c = this._buffer.charAt(endpos);
            if (this._isnotoken(c))
                break;
            endpos++;
        }

        var tok = {
            name: 'REGULAREXPRESSION',
            value: this._buffer.substring(this._pos, endpos),
            pos: this._pos,
            row: this._row,
            col: this._col
        };
        this._pos = endpos + 1;
        return tok;
    };

    PEGLexer.prototype._process_javascript_snippet = function () {
        var endpos = this._pos + 1;

        // Skip until the end of the line
        var level = 0;
        while (true) {
            var c = this._buffer.charAt(endpos);
            endpos++;

            if (c === '}') {
                if (level === 0)
                    break;
                else
                    level--;
            }
        }

        var tok = {
            name: 'JAVASCRIPT',
            value: this._buffer.substring(this._pos, endpos),
            pos: this._pos,
            row: this._row,
            col: this._col
        };
        this._pos = endpos + 1;
        return tok;
    };

    PEGLexer.prototype._process_comment = function () {
        var endpos = this._pos + 2;

        // Skip until the end of the line
        var c = this._buffer.charAt(this._pos + 2);
        while (true) {
            if (this._buffer.charAt(endpos) == '*') {
                if (this._buffer.charAt(endpos + 1) == '/') {
                    endpos++;
                    break;
                }
            }
            endpos++;
        }

        var tok = {
            name: 'COMMENT',
            value: this._buffer.substring(this._pos, endpos),
            pos: this._pos,
            row: this._row,
            col: this._col
        };
        this._pos = endpos + 1;
        return tok;
    };

    PEGLexer.prototype._process_comment_one_line = function () {
        var endpos = this._pos + 2;

        // Skip until the end of the line
        var c = this._buffer.charAt(this._pos + 2);
        while (endpos < this._buffer_length && !this._isnewline(this._buffer.charAt(endpos))) {
            endpos++;
        }

        var tok = {
            name: 'COMMENT',
            value: this._buffer.substring(this._pos, endpos),
            pos: this._pos,
            row: this._row,
            col: this._col
        };
        this._pos = endpos + 1;
        return tok;
    };

    PEGLexer.prototype._process_identifier = function () {
        var endpos = this._pos + 1;
        while (endpos < this._buffer_length && this._isalphanum(this._buffer.charAt(endpos))) {
            endpos++;
        }

        var tok = {
            name: 'IDENTIFIER',
            value: this._buffer.substring(this._pos, endpos),
            pos: this._pos,
            row: this._row,
            col: this._col
        };
        this._pos = endpos;
        return tok;
    };

    PEGLexer.prototype._process_quote = function () {
        // this.pos points at the opening quote. Find the ending quote.
        var end_index = this._buffer.indexOf('"', this._pos + 1);

        if (end_index === -1) {
            throw Error('Unterminated quote at ' + this._pos);
        } else {
            var tok = {
                name: 'QUOTE',
                value: this._buffer.substring(this._pos, end_index + 1),
                pos: this._pos,
                row: this._row,
                col: this._col
            };
            this._pos = end_index + 1;
            return tok;
        }
    };

    PEGLexer.prototype._skipnontokens = function () {
        while (this._pos < this._buffer_length) {
            var c = this._buffer.charAt(this._pos);
            if (c == ' ' || c == '\t') {
                this._pos_pp();
            } else if (c == '\r') {
                this._pos_pp();
                this._col = 1;
            } else if (c == '\n') {
                this._pos_pp();
                this._row++;
                this._col = 1;
            } else {
                break;
            }
        }
    };

    PEGLexer.prototype._pos_pp = function () {
        var p = this._pos;
        this._pos++;
        this._col++;
        return p;
    };
    return PEGLexer;
})();
