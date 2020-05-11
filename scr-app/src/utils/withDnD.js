import React, {useState} from 'react';
import {DndProvider} from 'react-dnd';
import Backend from 'react-dnd-html5-backend';
import {useDrag, useDrop} from 'react-dnd';
import update from 'immutability-helper';

export const ItemTypes = {
    BOX: 'box',
};

const withDnDProvider =Component=>props => (<DndProvider backend={Backend} ><Component {...props}/></DndProvider>);

export function withDrag(Component) {

    return function WithDrag({id, left, top, hideSourceOnDrag = true, ...props}) {
        const [{isDragging}, drag] = useDrag({
            item: {id, left, top, type: ItemTypes.BOX},
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        })
        if (isDragging && hideSourceOnDrag) {
            return <div ref={drag}/>
        }
        return (
            <div ref={drag} style={{left, top, position: 'absolute'}}>
                <Component {...props} />
            </div>
        )
    }
}

export function withDrop(Component) {
    return function WithDrop(props) {
        const [boxes, setBoxes] = useState({})
        const [, drop] = useDrop({
            accept: ItemTypes.BOX,
            drop(item, monitor) {
                const delta = monitor.getDifferenceFromInitialOffset();
                if (item && delta) {
                    const left = Math.round(item.left + delta.x)
                    const top = Math.round(item.top + delta.y)
                    moveBox(item.id, left, top)
                }

                return undefined
            },
        })
        const moveBox = (id, left, top) => {
            setBoxes(
                update(boxes, {
                    [id]: {
                        $merge: {left, top},
                    },
                }),
            )
        }
        return (
            <div ref={drop} style={{position: 'relative'}}>
                <Component {...props} draggables={boxes} setDraggables={setBoxes}/>
            </div>
        )
    }
}

export default withDnDProvider;