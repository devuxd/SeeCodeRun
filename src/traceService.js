import Esprima from 'esprima';

export class TraceService {

    constructor() {
        this.esprima = new Esprima();
    }

    getStackTrace(editor) {
        let code = editor.getValue();
        return this.esprima.parse(code, { loc: true});
    }
}