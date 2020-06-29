import {action} from '@storybook/addon-actions';
import {withKnobs, text, number} from "@storybook/addon-knobs";
import React, {forwardRef} from 'react';
import InfiniteStickyList from "../components/InfiniteStickyList";
import {withStyles} from '@material-ui/core/styles';
import Inspector from "react-inspector";

export default {
    title: 'InfiniteStickyList',
    component: InfiniteStickyList,
    decorators: [withKnobs],
};

const styles = theme => ({
    row: {},
    sticky: {
        backgroundColor: theme.palette.background.default,
        position: 'sticky !important',
        zIndex: 1,
    },
});

const StyledInfiniteStickyList = withStyles(styles)(InfiniteStickyList);

export const InfiniteStickyListWithInspector = () => {
    const defaultItems = new Array(number('Default items size', 200))
        .fill(true)
        .map((rowHeight, i) => ({
            label: `(${i})`,
            i,
            isActive: false
        }));

    const defaultIsItemLoaded = index => !!defaultItems[index];
    const defaultLoadMoreItems = (startIndex, stopIndex) => {
        for (let index = startIndex; index <= stopIndex; index++) {
            defaultItems[index] = {loading: true};
        }
        return new Promise(resolve =>
            setTimeout(() => {
                for (let index = startIndex; index <= stopIndex; index++) {
                    defaultItems[index] = {
                        label: `(${index})`,
                        index,
                        isActive: false
                    };
                }
                resolve();
            }, 10)
        );
    };
    const defaultRowContainer = forwardRef(({isSticky, isScrolling, ...props}, ref) => (
        <div ref={ref} {...props} />));
    const defaultRow = ({index, style, data}) => <Inspector
        data={{height: data.itemSize(index), ...data.items[index], ...style}}/>;
    const defaultStickyButton = ({isSticky, onStickyChange}) => (
        <button
            style={{position: "absolute", top: 0, left: 0,/* zIndex: 1*/}}
            onClick={event => action('onClick')(event) || onStickyChange(event)}
        >
            {isSticky ? "*" : "-"}
        </button>
    );

    const defaultProps = {
        items: defaultItems,
        defaultItemSize: 30,
        StickyComponent: defaultStickyButton,
        RowComponent: defaultRow,
        RowContainer: defaultRowContainer,
        isItemLoaded: defaultIsItemLoaded,
        loadMoreItems: defaultLoadMoreItems,
        stickyIndices: [],
        heightDelta: 0,
    };

    return (<div style={{
        height: number('Container Height', 800),
        width: text('Container Width', '100%')
    }}>
        <StyledInfiniteStickyList {...defaultProps}/>
    </div>)
};