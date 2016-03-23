export class AceUtils{
    constructor(){
        //stateless
    }
    // will add the tooltip rendering to a given editor.
    //It will find decorations and add show a tooltip if there row that matches the cursor.
    //The datamodel must contain a "rows" property with an array of rows as indexes.
    //Each row of rows should have a "text" property to be shown.
    // todo: generalize this method with a ViewModel{ view, datamodel} and enum for ace's events
    
    subscribeToEvents(editor, tooltip, gutterDecorationClassName, dataModel){
        let updateTooltip = this.updateTooltip;
        let isPositionInRange = this.isPositionInRange;
        let isRangeInRangeStrict = this.isRangeInRangeStrict; 

        // for tap/ click use guttermousedown
    	editor.on("guttermousemove", function(e){ 
    	    updateTooltip(tooltip, editor.renderer.textToScreenCoordinates(e.getDocumentPosition()));
    		let target = e.domEvent.target; 
    		// is this the element we want? They are Ace cells, "ace_gutter-cell", which have the gutterDecorationClassName CSS style
    		if (target.className.indexOf(gutterDecorationClassName) == -1){ 
    			return;
    		}
    		// is this during user attention?
    		if (!editor.isFocused()){ 
    			return;
    		}
    		// is not the folding icon to the right of the line number?
    		if (e.clientX > target.parentElement.getBoundingClientRect().right - 13){ 
    			return; 
    		}
    		let row = e.getDocumentPosition().row;
    		let text = "";
    		
    		if(dataModel.rows.hasOwnProperty(row)){
                    text = dataModel.rows[row].text; 
    				let pixelPosition = editor.renderer.textToScreenCoordinates(e.getDocumentPosition());
    				pixelPosition.pageY += editor.renderer.lineHeight;
    				updateTooltip(tooltip, pixelPosition, text);
    		}
    		e.stop(); 
    		 
    	});
    	
    	editor.on("mousemove", function (e){
		let position = e.getDocumentPosition(), match;
		if(position){ 
            // todo: Aurelia style
			let result = window.TRACE? window.TRACE.getExecutionTrace() : undefined;
			if(!result){
			    return;
			}
			
			for(let key in result){
			    let data = result[key];
			    
    			 if(data.range && isPositionInRange(position, data.range)){
    			     if(match){
    			         if(isRangeInRangeStrict(data.range, match.range)){
    			             match = data;
    			         }
    			     }else{
    			        match = data;
    			     }
    			 
    			 }
			}
			if(match){
    				let pixelPosition = editor.renderer.textToScreenCoordinates(match.range.start);
    				pixelPosition.pageY += editor.renderer.lineHeight;
    				updateTooltip(tooltip, pixelPosition, match.text +",  values"+ JSON.stringify(match.values));
    		}else{
    				updateTooltip(tooltip, editor.renderer.textToScreenCoordinates(position));
    		}
		}
		});
        
    }
    
    updateTooltip(div, position, text){
			
			div.style.left = position.pageX + 'px';
			div.style.top = position.pageY + 'px';
			if(text){
				div.style.display = "block";
				div.innerText = text;
			}else{
				div.style.display = "none";
				div.innerText = "";
			}
	}
	
	isPositionInRange(position, inRange){
        
        var matchesInOneLine = (
                position.row == inRange.start.row 
                && inRange.start.row  == inRange.end.row
                && position.column >= inRange.start.column
                && position.column <= inRange.end.column
            );
            
        if(matchesInOneLine){
            return true;
        }
            
        var matchesStart = (
                position.row == inRange.start.row 
                && inRange.start.row  < inRange.end.row
                && position.column >= inRange.start.column
            );
           
        if(matchesStart){
            return true;
        }
        
        var matchesEnd = (
                position.row == inRange.end.row
                && inRange.start.row  < inRange.end.row
                && position.column <= inRange.end.column
            );

        return matchesEnd;

    }
    
    isRangeInRange(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column >= inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column <= inRange.end.column)
    			);
    }
    
    isRangeInRangeStrict(isRange, inRange){
        return (
                (isRange.start.row >= inRange.start.row && isRange.start.column > inRange.start.column)
    			 &&
    			(isRange.end.row <= inRange.end.row && isRange.end.column < inRange.end.column)
    			);
    }
    
    updateGutterDecorations(editor, previousRows, rows, gutterDecorationClassName){
        this.removeGutterDecorations(editor, previousRows, gutterDecorationClassName);
        this.addGutterDecorations(editor, rows, gutterDecorationClassName);
	}
	
	addGutterDecorations(editor, rows, gutterDecorationClassName){
        for (let row in rows) {
            if(rows.hasOwnProperty(row)){
                 editor.getSession().addGutterDecoration(row, gutterDecorationClassName);
            }
        }
	}
		
	removeGutterDecorations(editor, rows, gutterDecorationClassName){
        for(let row in rows){ 
            if(rows.hasOwnProperty(row)){
             editor.getSession().removeGutterDecoration(row, gutterDecorationClassName);
            }
        }
	}
	
    
    getDefaultGutterRenderer(){
        return {
            getWidth: function(session, lastLineNumber, config) {
                return lastLineNumber.toString().length * config.characterWidth;
            },
            getText: function(session, row) {
                return row + 1;
            }
        };
    }  
    
    
    
    /**
     * setTraceGutterRenderer
     * parameters: 
     *              @editor, 
     * description: 
     * pre: editor is defined
     * post: 
     **/
    setTraceGutterRenderer(editor, traceGutterData){
        
        let session = editor.getSession(); // maybe attach the gutterdata to the session?
        let traceGutterRenderer =  {
            getWidth: function(session, lastLineNumber, config) {
                let format = "";
                if(traceGutterData.maxCount > 0){
                    format = "[] ";// adds the brackets and space chars 
                }
                
                return (format.length + traceGutterData.maxCount.toString().length + lastLineNumber.toString().length )* config.characterWidth;
            },
            getText: function(session, row) {
                if(traceGutterData.rows.hasOwnProperty(row)){
                    let count = traceGutterData.rows[row].count; // "never" 0
                    return "["+ count +"] "+ (row + 1);
                }else{
                    return row + 1;
                }
            }
        };
        session.gutterRenderer = traceGutterRenderer;
    }
    
// If more gutter customization is needed. modify this is more than text is needed. Taken from Ace's source code [gutter.js]    
// usage: editor.on("afterRender", updateTraceAnnotations(editor)) // requires DOM access [Aurelia: call within attached()]
    customUpdateGutter(editor, traceGutterRenderer) {
        let dom = document;
        let gutter = editor.renderer.$gutterLayer;
        session.gutterRenderer = traceGutterRenderer;
        let config = editor.renderer.layerConfig;
        let session = editor.getSession();
        let firstRow = config.firstRow;
        var lastRow = Math.min(config.lastRow + config.gutterOffset,  // needed to compensate for hor scollbar
            session.getLength() - 1);
        var fold = session.getNextFoldLine(firstRow);
        var foldStart = fold ? fold.start.row : Infinity;
        var foldWidgets = gutter.$showFoldWidgets && session.foldWidgets;
        var breakpoints = session.$breakpoints;
        var decorations = session.$decorations;
        var firstLineNumber = session.$firstLineNumber;
        var lastLineNumber = 0;
        
        var gutterRenderer = session.gutterRenderer || gutter.$renderer;

        var cell = null;
        var index = -1;
        var row = firstRow;
        while (true) {
            if (row > foldStart) {
                row = fold.end.row + 1;
                fold = session.getNextFoldLine(row, fold);
                foldStart = fold ? fold.start.row : Infinity;
            }
            if (row > lastRow) {
                while (gutter.$cells.length > index + 1) {
                    cell = gutter.$cells.pop();
                    gutter.element.removeChild(cell.element);
                }
                break;
            }

            cell = gutter.$cells[++index];
            if (!cell) {
                cell = {element: null, textNode: null, foldWidget: null};
                cell.element = dom.createElement("div");
                cell.textNode = document.createTextNode('');
                cell.element.appendChild(cell.textNode);
                gutter.element.appendChild(cell.element);
                gutter.$cells[index] = cell;
            }

            var className = "ace_gutter-cell ";
            if (breakpoints[row])
                className += breakpoints[row];
            if (decorations[row])
                className += decorations[row];
            if (gutter.$annotations[row])
                className += gutter.$annotations[row].className;
            if (cell.element.className != className)
                cell.element.className = className;

            var height = session.getRowLength(row) * config.lineHeight + "px";
            if (height != cell.element.style.height)
                cell.element.style.height = height;

            if (foldWidgets) {
                var c = foldWidgets[row];
                // check if cached value is invalidated and we need to recompute
                if (c == null)
                    c = foldWidgets[row] = session.getFoldWidget(row);
            }

            if (c) {
                if (!cell.foldWidget) {
                    cell.foldWidget = dom.createElement("span");
                    cell.element.appendChild(cell.foldWidget);
                }
                var className = "ace_fold-widget ace_" + c;
                if (c == "start" && row == foldStart && row < fold.end.row)
                    className += " ace_closed";
                else
                    className += " ace_open";
                if (cell.foldWidget.className != className)
                    cell.foldWidget.className = className;

                var height = config.lineHeight + "px";
                if (cell.foldWidget.style.height != height)
                    cell.foldWidget.style.height = height;
            } else {
                if (cell.foldWidget) {
                    cell.element.removeChild(cell.foldWidget);
                    cell.foldWidget = null;
                }
            }
            
            var text = lastLineNumber = gutterRenderer
                ? gutterRenderer.getText(session, row)
                : row + firstLineNumber;
            if (text != cell.textNode.data)
                cell.textNode.data = text;

            row++;
        }
         gutter.element.style.height = config.minHeight + "px";

        if (gutter.$fixedWidth || session.$useWrapMode)
            lastLineNumber = session.getLength() + firstLineNumber;

        var gutterWidth = gutterRenderer 
            ? gutterRenderer.getWidth(session, lastLineNumber, config)
            : lastLineNumber.toString().length * config.characterWidth;
        
        var padding = gutter.$padding || gutter.$computePadding();
        gutterWidth += padding.left + padding.right;
        if (gutterWidth !== gutter.gutterWidth && !isNaN(gutterWidth)) {
            gutter.gutterWidth = gutterWidth;
            gutter.element.style.width = Math.ceil(gutter.gutterWidth) + "px";
            gutter._emit("changeGutterWidth", gutterWidth);
        }
    }
    
    // example using ACE Annotations
    appendAnnotations(editor, annotations) {
            let aceAnnotations = editor.getSession().getAnnotations();	
            annotations= annotations.concat(aceAnnotations);
    		editor.getSession().setAnnotations(annotations);
    }
    
    compareRanges(){
        
    }

    hoverRange(){
        
    }
    getSmallestRange(){
         
    }
    getRanges(){
         
    }
    
}
