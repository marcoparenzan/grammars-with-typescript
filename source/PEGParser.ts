/// <reference path="PEGToken.ts" />
/// <reference path="PEGLexer.ts" />
/// <reference path="PEGProduction.ts" />
/// <reference path="PEGParseAction.ts" />

class PEGParser {
	_lexer: PEGLexer;
	_tokens: PEGToken[];

	constructor(lexer: PEGLexer) {
		this._lexer = lexer;
	}
		
	_can_be(tokens:string[]): boolean {
		
		if (this._tokens == null)
		{
			this._tokens = this._lexer.tokens(tokens.length);
			if (this._tokens.length<tokens.length) return false;
		}
		else
		{
			if (this._tokens.length<tokens.length)
			{
				var tt: PEGToken[] = this._lexer.tokens(tokens.length-this._tokens.length);
				tt.forEach(xx => this._tokens.push(xx));
				if (this._tokens.length<tokens.length) return false;
			}
		}
		var i:number = 0;
		while(true)
		{
			if (i == tokens.length) break;
			if (tokens[i] != this._tokens[i].name) return false;
			i++;
		}
		
		return true;
	}
	
	// it doesn't check anything. Use with _can_be!
	_capture(n:number):PEGToken[]
	{
		return this._tokens.splice(0, n);		
	}
	
    parse(): PEGProduction[] {
        var productions: PEGProduction[] = [];
        var temp: PEGToken[];

        // production loop
        while (true)
        {
            if (!this._can_be(["IDENTIFIER", "EQUALS"])) throw Error("Expected production name");
            temp = this._capture(2);
            var production_name:string = temp[0].value;

            // production alternatives loop
            var production_empty = true;
            var current_action: PEGParseAction = {};
            while (true)
            {
                if (this._can_be(["COMMENT"]))
                {
                    this._capture(1);
                    continue;
                }
                else if (this._can_be(["QUOTE"])) {
                    temp = this._capture(1);
                    var quote = temp[0].value;

                    production_empty = false;
                    continue;
                }
                else if (this._can_be(["IDENTIFIER", "COLON", "IDENTIFIER"]))
                {
                    temp = this._capture(3);
                    var child_name = temp[0].value;
                    var selected_production = temp[2].value;

                    production_empty = false;
                    continue;
                }
                else if (this._can_be(["IDENTIFIER"])) {
                    temp = this._capture(1);
                    var selected_production = temp[0].value;

                    production_empty = false;
                    continue;
                }

                if (this._can_be(["JAVASCRIPT"]))
                {
                    temp = this._capture(1);
                    var javascript = temp[0].value;
                }

                if (this._can_be(["PIPE"])) {
                    this._capture(1);
                    continue;
                }
                else if (this._can_be(["IDENTIFIER", "EQUALS"])) {
                    break;
                }
            }
            if (production_empty) throw Error("Production is empty");
        }

        return productions;
	}
}