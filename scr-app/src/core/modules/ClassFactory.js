const ErrorClasses = {
    Error: class Error {
    },
    EvalError: class EvalError {
    },
    InternalError: class InternalError {
    },
    RangeError: class RangeError {
    },
    ReferenceError: class ReferenceError {
    },
    SyntaxError: class SyntaxError {
    },
    TypeError: class TypeError {
    },
    URIError: class URIError {
    },
    DependencyError: class DependencyError {
    },
    HaltingError: class HaltingError {
    },
    UnknownError: class UnknownError {
    },
};

class ClassFactory {
    static fromErrorClassName(className, message) {
        const obj = new (ErrorClasses[className] || ErrorClasses.UnknownError)();
        obj.message = message;
        return obj;
    }

}

export default ClassFactory;