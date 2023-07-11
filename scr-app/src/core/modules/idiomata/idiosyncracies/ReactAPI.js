const addMapEntry = (entry, map) => {

    if (!entry) {
        return -1;
    }

    const i = map.indexOf(entry);

    if (i > -1) {
        return i;
    }

    return map.push(entry) - 1;
};

const filterOwnedComponents = (component, components) => {
    return components.filter(
        (otherComponent) => otherComponent?._owner?.type === component.type
    );
};

// const filterOwnedComponents = (component, components) => {
//     return components.filter(
//         (otherComponent) => otherComponent?._owner?.type === component.type
//     );
// };
//
// const filter_OwnerComponents = (component, components) => {
//     return components.filter(
//         (otherComponent) =>(otherComponent?._owner && otherComponent._owner === component?._owner)
//     );
// }

class ComponentTreeNode {
    component;
    ownedComponents = [];
    ownerComponentTreeNodes = [];
    ownedComponentTreeNodes = [];

    constructor(component, components) {
        this.component = component;
        this.ownedComponents = filterOwnedComponents(component, components);
    }

    getComponent = () => {
        return this.component;
    }

    refCurrent = () => {
        return this.getComponent().ref?.current;
    };

    getOwnedComponents = () => {
        return this.ownedComponents;
    };

    addOwnerComponentTreeNode = (owner) => {
        return addMapEntry(owner, this.ownerComponentTreeNodes);
    }

    addOwnedComponentTreeNode = (owned) => {
        return addMapEntry(owned, this.ownedComponentTreeNodes);
    }

    getOwnerComponentTreeNodes = () => {
        return this.ownerComponentTreeNodes;
    }

    getOwnedComponentTreeNodes = () => {
        return this.ownedComponentTreeNodes;
    }
}

export const findComponentTreeNodeByComponent = (componentToFind, componentTreeNodeArray) => {
    return componentTreeNodeArray.find(({getComponent}) => getComponent() === componentToFind);
};

export const componentTreeNodeVisitor = (componentTreeNode, componentTreeNodeArray, owner = null) => {
    if (!componentTreeNode || !componentTreeNodeArray) {
        return;
    }

    componentTreeNode.addOwnerComponentTreeNode(owner);
    componentTreeNode.getOwnedComponents().forEach((component) => {
        const found = findComponentTreeNodeByComponent(component, componentTreeNodeArray);
        if (found) {
            componentTreeNodeVisitor(found, componentTreeNodeArray, componentTreeNode);
            componentTreeNode.addOwnedComponentTreeNode(found);
        }
    });
};

const getRootComponentTreeNode = (componentTreeNodeArray) => componentTreeNodeArray.find(
    ({getComponent}) => getComponent()._owner === null
);

const findOwnedComponentTreeNodeWithRef = (componentTreeNode) => {
    if (!componentTreeNode) {
        return null;
    }

    if (componentTreeNode.refCurrent()) {
        return componentTreeNode;
    }

    return componentTreeNode.getOwnedComponentTreeNodes().find(findOwnedComponentTreeNodeWithRef);
};

export class ReactElementRefTree {
    rootComponentTreeNode;
    componentTreeNodeArray;

    constructor(components) {
        const componentTreeNodeArray = components.map((component) => {
            return new ComponentTreeNode(component, components);
        });

        const rootComponentTreeNode = getRootComponentTreeNode(componentTreeNodeArray);

        componentTreeNodeVisitor(rootComponentTreeNode, componentTreeNodeArray);

        this.rootComponentTreeNode = rootComponentTreeNode;
        this.componentTreeNodeArray = componentTreeNodeArray;
    }

    findComponentWithRefByComponent = (componentToFindRef) => {
        return findOwnedComponentTreeNodeWithRef(
            findComponentTreeNodeByComponent(
                componentToFindRef,
                this.componentTreeNodeArray
            )
        );
    }
}
