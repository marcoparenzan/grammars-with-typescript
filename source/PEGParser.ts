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
        var current_production: PEGProduction = {
            name: ""
            , actions: []
        };
        var commit_current_production: () => void = () => {
            // commit current production
            productions[current_production.name] = current_production;
            // next production
            current_production = {
                name: ""
                , actions: []
            };
        };
        while (true)
        {
            if (!this._can_be(["IDENTIFIER", "EQUALS"])) throw Error("Expected production name");
            temp = this._capture(2);
            current_production.name = temp[0].value;

            // production alternatives loop
            var production_empty = true;
            var current_action: PEGParseAction = {
                steps: []
                , javascript: ""
            };
            var commit_current_action: () => void = () => {
                current_production.actions.push(current_action);
                var current_action: PEGParseAction = {
                    steps: []
                    , javascript: ""
                };
            };
            while (true)
            {
                if (this._can_be(["COMMENT"]))
                {
                    this._capture(1);
                    continue;
                }
                else if (this._can_be(["QUOTE"])) {
                    temp = this._capture(1);
                    current_action.steps.push({
                        type: "QUOTE"
                        , value: temp[0].value
                    });

                    production_empty = false;
                    continue;
                }
                else if (this._can_be(["IDENTIFIER"]))
                {
                    temp = this._capture(1);
                    var current_identifier: PEGIdentifierStep = 
                    {
                        type: "IDENTIFIER"
                        , value: temp[0].value
                        , identifier_type: "NONE"
                        , identifier_type_type: "NONE"
                    };

                    if (this._can_be(["COLON"]))
                    {
                        temp = this._capture(1);
                        if (this._can_be(["IDENTIFIER"])) {
                            temp = this._capture(1);
                            current_identifier.identifier_type = temp[0].value;
                            current_identifier.identifier_type_type = "PRODUCTION";
                        }
                        else if (this._can_be(["REGULAREXPRESSION"])) {
                            temp = this._capture(1);
                            current_identifier.identifier_type = temp[0].value;
                            current_identifier.identifier_type_type = "REGULAREXPRESSION";
                       }
                        else
                            throw Error("Typename expected");
                    }
                    // else nothing....untyped
                    current_action.steps.push(current_identifier);

                    production_empty = false;
                    continue;
                }

                if (this._can_be(["JAVASCRIPT"]))
                {
                    temp = this._capture(1);
                    current_action.javascript = temp[0].value;
                }

                if (this._can_be(["PIPE"])) {
                    commit_current_action();
                    this._capture(1);
                    continue;
                }
                else if (this._can_be(["IDENTIFIER", "EQUALS"])) {
                    commit_current_action();
                    if (production_empty)
                        throw Error("Production is empty");
                    else {
                        commit_current_production();
                        production_empty = true;
                    }
                    break;
                }
            }
        }

        return productions;
	}
}