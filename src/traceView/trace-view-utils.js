/*global $ */
export class TraceViewUtils{
    /**
     *
     *
     * */
    static attachExpressionDataExplorerOnHover($selector, eventAggregator, elementDecorator, showTooltipDelay = 750, hideToolTipDelay = 750){
        let $selection = $($selector);
        let timeout =  null;

        $selection.mouseenter(function selectionShowDataExplorer(){
            clearTimeout(timeout);
            let indexInTimeline = $(this).data('itimeline');
            timeout = setTimeout(function publishShowTooltip(){
                eventAggregator.publish("expressionDataExplorerShowTooltip", {indexInTimeline: indexInTimeline, elementDecorator: elementDecorator});
            });
        });

        $selection.mouseleave(function selectionHideDataExplorer(){
            clearTimeout(timeout);
            let indexInTimeline = $(this).data('itimeline');
            timeout = setTimeout(function publishHideTooltip(){
                eventAggregator.publish("expressionDataExplorerHideTooltip", {indexInTimeline: indexInTimeline, elementDecorator: elementDecorator});
            });
        });
    }
}