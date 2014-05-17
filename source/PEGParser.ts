/// <reference path="PEGToken.ts" />
/// <reference path="PEGLexer.ts" />
/// <reference path="PEGProduction.ts" />

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
	
	parse(): void {
		
	}
}