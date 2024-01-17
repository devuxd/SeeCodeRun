
const KnowledgeSourceType = {
    DOC: "Documentation",
    CODE: "Source Code",
    STATE: "Program State",
    OUT: "Program Output",
    REVIEW: "Code Review",
    REPO: "Knowledge Repo",
    OTHER: "Other Knowledge Source",
};

class DialogTree {
    generalizer = null;
    specifier= null;
    antecedent = null;
    consequents = null;
    abductors= null;
    anologies = null;
}

class IdiomaticError{
    targetCode ="";
    bundle ={};
    targetLoc = {};
    bundleLocs = {};
    representationMaps = {};
    constructor() {

    }

}

// todo: load iframe with code and higlight location
class URLRepresentation {
    url= "";
    textFragmentRationale = {};
}

class URLRepresentation {
    url= "";
    textFragmentRationale = {};
}
