export const getDefaultBreakPoint = () => ('lg');

export const getDefaultRowHeights = () => ({
    lg: 10,
});

export const getDefaultGridBreakpoints = () => ({
    lg: 1200,
});

export const getDefaultGrid = () => ({
    cols: {lg: 100},
    rows: {lg: 50},
});

export const getDefaultGridUnits = (grid) => ((cl, bk, prop) => {
    return Math.floor(grid[cl][bk] * (prop / 100));
});

export const getCellToIndex = (layouts, bk) => {
    const cellToIndex = {};
    layouts[bk].forEach((cell, index) => {
        cellToIndex[cell.i] = index;
    });
    return cellToIndex;
};

export const configureGetDefaultGridLayouts = (grid, getGridUnits) => () => (({
    lg:
        [
            {
                i: 'scriptContainer',
                x: 0,
                y: 0,
                w: getGridUnits('cols', 'lg', 40),
                h: getGridUnits('rows', 'lg', 60),
                isDraggable: false
            },
            {
                i: 'htmlContainer',
                x: getGridUnits('cols', 'lg', 40),
                y: 0,
                w: getGridUnits('cols', 'lg', 20),
                h: getGridUnits('rows', 'lg', 40),
                isDraggable: false,
            },
            {
                i: 'cssContainer',
                x: getGridUnits('cols', 'lg', 40),
                y: getGridUnits('rows', 'lg', 40),
                w: getGridUnits('cols', 'lg', 20),
                h: getGridUnits('rows', 'lg', 20),
                isDraggable: false,
            },
            {
                i: 'debugContainer',
                x: getGridUnits('cols', 'lg', 40) + getGridUnits('cols', 'lg', 20),
                y: 0,
                w: grid.cols.lg - (getGridUnits('cols', 'lg', 40) + getGridUnits('cols', 'lg', 20)),
                h: getGridUnits('rows', 'lg', 60),
                isDraggable: false,
            },
            {
                i: 'playgroundContainer',
                x: 0,
                y: getGridUnits('rows', 'lg', 60),
                w: grid.cols.lg,
                h: grid.rows.lg - (getGridUnits('rows', 'lg', 60)),
            },
        ]
}));


export const getDefaultlayoutFormatInvariant = (C2I) => ((layout, sourceI, maxRows, maxCols) => {
    layout[C2I.scriptContainer].x = 0;
    layout[C2I.htmlContainer].y = layout[C2I.scriptContainer].y;
    layout[C2I.debugContainer].y = layout[C2I.scriptContainer].y;


    layout[C2I.htmlContainer].x = layout[C2I.scriptContainer].w;
    layout[C2I.cssContainer].x = layout[C2I.htmlContainer].x;

    layout[C2I.scriptContainer].minH = 2;
    layout[C2I.debugContainer].minH = 2;
    layout[C2I.playgroundContainer].minH = 2;
    layout[C2I.htmlContainer].minH = 1;
    layout[C2I.cssContainer].minH = 1;

    layout[C2I.playgroundContainer].minW = layout[C2I.playgroundContainer].w;

    layout[C2I.scriptContainer].maxW = layout[C2I.debugContainer].x - 1;
    layout[C2I.cssContainer].y = layout[C2I.htmlContainer].y + layout[C2I.htmlContainer].h;

    let finalH = 0;
    switch (sourceI) {
        case 'debugContainer':
            finalH = layout[C2I.debugContainer].h;
            break;
        case 'scriptContainer':
            finalH = layout[C2I.scriptContainer].h;
            break;
        case 'htmlContainer':
            finalH = layout[C2I.htmlContainer].h + layout[C2I.cssContainer].h;
            layout[C2I.cssContainer].h = finalH - layout[C2I.htmlContainer].h;
            break;
        case 'cssContainer':
            finalH = layout[C2I.htmlContainer].h + layout[C2I.cssContainer].h;
            layout[C2I.htmlContainer].h = finalH - layout[C2I.cssContainer].h;
            break;
        default:
            finalH = maxRows - layout[C2I.playgroundContainer].h;
            if (finalH < layout[C2I.scriptContainer].minH) {
                finalH = layout[C2I.scriptContainer].minH;
                layout[C2I.playgroundContainer].h = maxRows - finalH;
            }
    }

    if (sourceI !== 'playgroundContainer') {
        if (maxRows - finalH < layout[C2I.playgroundContainer].minH) {
            finalH = maxRows - layout[C2I.playgroundContainer].minH;
            layout[C2I.playgroundContainer].h = layout[C2I.playgroundContainer].minH;
        } else {
            layout[C2I.playgroundContainer].h = maxRows - finalH;
        }
    }

    layout[C2I.scriptContainer].h = finalH;
    layout[C2I.debugContainer].h = finalH;

    layout[C2I.cssContainer].h = finalH - layout[C2I.htmlContainer].h;
    if (layout[C2I.cssContainer].h < layout[C2I.cssContainer].minH) {
        layout[C2I.cssContainer].h = layout[C2I.cssContainer].minH;
    }
    layout[C2I.htmlContainer].h = finalH - layout[C2I.cssContainer].h;
});

export const getDefaultFormatLayoutHeight = (C2I, grid, currentBreakPoint) => ((layout, sourceIndex) => {
    if (layout[sourceIndex].h
        + layout[C2I.playgroundContainer].h > grid.rows[currentBreakPoint]) {
        layout[C2I.playgroundContainer].h =
            grid.rows[currentBreakPoint] - layout[sourceIndex].h;

        if (layout[C2I.playgroundContainer].h < layout[C2I.playgroundContainer].minH) {
            layout[C2I.playgroundContainer].h = layout[C2I.playgroundContainer].minH;
        }
        layout[sourceIndex].h =
            grid.rows[currentBreakPoint] - layout[C2I.playgroundContainer].h;
    } else {
        layout[C2I.playgroundContainer].h =
            grid.rows[currentBreakPoint] - layout[sourceIndex].h;
    }
});


export const getDefaultLayoutFormatter = (C2I, grid, currentBreakPoint, formatLayoutHeight, layoutFormatInvariant) => {
    return (layout, oldItem, newItem) => {
        if (newItem.i === 'scriptContainer') {
            const newX = layout[C2I.scriptContainer].x + layout[C2I.scriptContainer].w;
            layout[C2I.htmlContainer].x = newX;
            layout[C2I.cssContainer].x = newX;
            const newW = grid.cols[currentBreakPoint] - layout[C2I.scriptContainer].w - layout[C2I.debugContainer].w;
            layout[C2I.htmlContainer].w = newW;
            layout[C2I.cssContainer].w = newW;

            formatLayoutHeight(layout, C2I.scriptContainer);
            if (layout[C2I.scriptContainer].h > layout[C2I.htmlContainer].h) {
                layout[C2I.cssContainer].h = layout[C2I.scriptContainer].h - layout[C2I.htmlContainer].h;
            } else {
                layout[C2I.htmlContainer].h = layout[C2I.htmlContainer].h - 1;
                layout[C2I.cssContainer].y = layout[C2I.htmlContainer].y + layout[C2I.htmlContainer].h;
                layout[C2I.cssContainer].h = 1;
            }

            layout[C2I.debugContainer].h = layout[C2I.scriptContainer].h;
        }

        if (newItem.i === 'htmlContainer' || newItem.i === 'cssContainer') {

            if (newItem.i === 'cssContainer') {
                let newH = layout[C2I.htmlContainer].h + layout[C2I.cssContainer].h;
                if (newH + layout[C2I.playgroundContainer].h > grid.rows[currentBreakPoint]) {
                    layout[C2I.cssContainer].h = layout[C2I.scriptContainer].h - layout[C2I.htmlContainer].h;
                    newH = layout[C2I.htmlContainer].h + layout[C2I.cssContainer].h;
                }
                layout[C2I.scriptContainer].h = newH;
                layout[C2I.debugContainer].h = newH;
                formatLayoutHeight(layout, C2I.scriptContainer);
                layout[C2I.htmlContainer].w = layout[C2I.cssContainer].w;

            } else {
                layout[C2I.cssContainer].w = layout[C2I.htmlContainer].w;

                const newH = layout[C2I.scriptContainer].h - layout[C2I.htmlContainer].h;
                if (newH > 0) {
                    layout[C2I.cssContainer].h = newH;
                } else {
                    layout[C2I.htmlContainer].h = layout[C2I.scriptContainer].h - layout[C2I.cssContainer].h;
                }

            }
            layout[C2I.cssContainer].y = layout[C2I.htmlContainer].y + layout[C2I.htmlContainer].h;
            layout[C2I.scriptContainer].h = layout[C2I.cssContainer].h + layout[C2I.htmlContainer].h;
            layout[C2I.debugContainer].h = layout[C2I.cssContainer].h + layout[C2I.htmlContainer].h;

            const newX = layout[C2I.htmlContainer].x + layout[C2I.htmlContainer].w;
            const newW =
                (grid.cols[currentBreakPoint] - (layout[C2I.scriptContainer].w + layout[C2I.htmlContainer].w)) || 1;

            if (newX + newW > grid.cols[currentBreakPoint]) {
                const maxW =
                    grid.cols[currentBreakPoint] - (layout[C2I.scriptContainer].w + layout[C2I.debugContainer].w);
                layout[C2I.cssContainer].w = maxW;
                layout[C2I.htmlContainer].w = maxW;
            } else {
                layout[C2I.debugContainer].x = newX;
                layout[C2I.debugContainer].w = newW
            }
        }

        if (newItem.i === 'debugContainer') {
            layout[C2I.debugContainer].w =
                grid.cols[currentBreakPoint] - (layout[C2I.scriptContainer].w + layout[C2I.htmlContainer].w);

            layout[C2I.scriptContainer].h = layout[C2I.debugContainer].h;
            formatLayoutHeight(layout, C2I.scriptContainer);
            layout[C2I.debugContainer].h = layout[C2I.scriptContainer].h;

            if (layout[C2I.debugContainer].h > layout[C2I.htmlContainer].h) {
                layout[C2I.cssContainer].h = layout[C2I.debugContainer].h - layout[C2I.htmlContainer].h;
            } else {
                layout[C2I.htmlContainer].h = layout[C2I.htmlContainer].h - 1;
                layout[C2I.cssContainer].h = 1;
            }

        }

        if (newItem.i === 'playgroundContainer') {
            let newH = grid.rows[currentBreakPoint] - layout[C2I.scriptContainer].h;
            let sourceContainer = layout[C2I.playgroundContainer];
            let targetContainer = layout[C2I.scriptContainer];

            if (newH > 1) {
                targetContainer.h = newH;
            } else {
                sourceContainer.h = grid.rows[currentBreakPoint] - targetContainer.h;
            }
        }
        layoutFormatInvariant(layout, newItem.i, grid.rows[currentBreakPoint], grid.cols[currentBreakPoint]);
    };
};

export const geDefaultValidateLayout = (/*C2I*/) => ((gridLayouts, currentBreakPoint) => {
    gridLayouts[currentBreakPoint] = gridLayouts[currentBreakPoint].filter(el => el.id !== 'consoleContainer');
    return gridLayouts;
});

export const configureDefaultGridLayoutFormatter = (currentBreakPoint = getDefaultBreakPoint()) => {
    const gl = {currentBreakPoint: currentBreakPoint};
    gl.gridBreakpoints = getDefaultGridBreakpoints();
    gl.grid = getDefaultGrid();
    gl.rowHeights = getDefaultRowHeights();
    gl.getGridUnits = getDefaultGridUnits(gl.grid);
    gl.getDefaultGridLayouts = configureGetDefaultGridLayouts(gl.grid, gl.getGridUnits);
    gl.currentGridLayouts = gl.getDefaultGridLayouts();
    gl.C2I = getCellToIndex(gl.currentGridLayouts, currentBreakPoint);
    gl.formatLayoutHeight = getDefaultFormatLayoutHeight(gl.C2I, gl.grid, currentBreakPoint);
    gl.layoutFormatInvariant = getDefaultlayoutFormatInvariant(gl.C2I);
    gl.formatLayout = getDefaultLayoutFormatter(gl.C2I, gl.grid, currentBreakPoint, gl.formatLayoutHeight, gl.layoutFormatInvariant);
    gl.getLayoutDummy = (layout) => { // required to force RGL render on reset layout
        const hack = layout ? {...layout} : gl.getDefaultGridLayouts();
        hack[gl.currentBreakPoint] = [...hack[gl.currentBreakPoint], {
            i: 'dummy',
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }];
        return hack;
    };
    gl.onBreakpointChange = bk => {
        gl.currentBreakPoint = bk;
        gl.C2I = getCellToIndex(gl.currentGridLayouts, bk);
        gl.formatLayoutHeight = getDefaultFormatLayoutHeight(gl.C2I, gl.grid, bk);
        gl.layoutFormatInvariant = getDefaultlayoutFormatInvariant(gl.C2I);
        gl.formatLayout = getDefaultLayoutFormatter(gl.C2I, gl.grid, bk, gl.formatLayoutHeight, gl.layoutFormatInvariant);
    };
    gl.validateLayout = geDefaultValidateLayout(/*gl.C2I*/);

    return gl;
};
