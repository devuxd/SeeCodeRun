
const code = "BABEL_PARSER_SYNTAX_ERROR";

const EnhancementType = {
    HIGHLIGHT_MESSAGE: "HIGHLIGHT_MESSAGE",
    HIGHLIGHT_CODE: "HIGHLIGHT_CODE",
};

const reasonCode2Enhancement = {
    UnexpectedReservedWord:{
        regex: /(Unexpected\s+reserved\s+word\s+)[^\w](\w+)[^\w]\.(\s+\((\d+)\:(\d+)\))/gm,
        messageReplacer: function (str){
            let m = this.regex.exec(str);

            if(!m){
                return {replacedMessage: str, position: null, messageFragments: []};
            }

            return {replacedMessage: `${m[0]}`, position: {line: m[4], column: m[5]}, messageFragments: [m[2]]};
        }
    }
};
export default class BabelParserSyntaxErrorEnhancer {
    constructor(monaco, monacoEditor) {
        // make range and decorator
    }

    enhanceError(error){
        if (!error || error?.code !== code){
            return null;
        }

        const {reasonCode, message, loc} = error;

        const {messageReplacer} = reasonCode2Enhancement[reasonCode]??{};

        if(!messageReplacer){
            return null;
        }

        const {replacedMessage, messageFragments} = messageReplacer(message);
        // add text fragments array, and higlight indices

    }

}
