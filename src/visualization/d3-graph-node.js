
export class D3GraphNode {
    constructor(type = 'NahType', name = 'NahName', range = {start:{row: 0, column:0}, end:{row: 0, column:0}}, value = 'NahValue') {
        this.children = [];
        this.parents = [];
        this.type = type;
        this.name = name;
        this.range = range;
        this.value = value;
    }

    addParent(rent) {
        this.getParents().push(rent);
    }

    addChild(child) {
        this.getChildren().push(child);
        this.getChildren()[ this.getChildren().length - 1 ].addParent( this ) ;
    }

    setName(name) {
        this.name = name;
    }

    setRange(range) {
        this.range = range;
    }

    setValue(value) {
        this.value = value;
    }

    hasChild(child) {
        for (let i = 0; i < this.children.length; i++)
            if (this.children[i] === child)
                return true;
        return false;
    }

    hasParent(par) {
        for (let i = 0; i < this.parents.length; i++)
            if (this.parents[i] === par)
                return true;
        return false;
    }

    getChildren() {
        return this.children;
    }

    getParents() {
        return this.parents;
    }

    getRange() {
        return this.range;
    }

    getValue() {
        return this.value;
    }

    getName() {
        return this.name;
    }

    getType() {
        return this.type;
    }
}
