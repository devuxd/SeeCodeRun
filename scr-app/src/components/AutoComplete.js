//Original: https://material-ui-next.com/demos/autocomplete/
import React from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import Paper from 'material-ui/Paper';
import {MenuItem} from 'material-ui/Menu';
import {withStyles} from 'material-ui/styles';

const renderSuggestionsContainer = options => {
    const {containerProps, children} = options;

    return (
        <Paper {...containerProps} square>
            {children}
        </Paper>
    );
};

const styles = (theme) => ({
    container: {
        flexGrow: 1,
        position: 'relative',
        maxWidth: 250,
        maxHeight: 250,
        height: 250,
        width: 250,
        overflow: 'visible',
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
    },
    suggestionsContainerOpen: {
        position: 'absolute',
        zIndex: 1,
        left: 0,
        right: 0,
        overflow: 'auto',
    },
    suggestion: {
        display: 'block',
    },
    suggestionsList: {
        margin: 0,
        padding: 0,
        listStyleType: 'none',
    },
});

class AutoComplete extends React.Component {
    state = {
        suggestions: [],
        isShowAll: true,
    };

    renderSuggestion = (suggestion, {query, isHighlighted}) => {
        const {isShowAll} = this.state;

        if (isShowAll) {
            return (
                <MenuItem selected={isHighlighted} component="div">
                    <div>
                        <span style={{fontWeight: 300}}>{suggestion.label}</span>
                    </div>
                </MenuItem>
            );
        }
        const matches = match(suggestion.label, query);
        const parts = parse(suggestion.label, matches);

        return (
            <MenuItem selected={isHighlighted} component="div">
                <div>
                    {parts.map((part, index) => {
                        return part.highlight ? (
                            <span key={String(index)} style={{fontWeight: 300}}>
              {part.text}
            </span>
                        ) : (
                            <strong key={String(index)} style={{fontWeight: 500}}>
                                {part.text}
                            </strong>
                        );
                    })}
                </div>
            </MenuItem>
        );
    };

    handleSuggestionsFetchRequested = ({value}) => {
        const suggestionsResult = this.props.getSuggestions(value);
        this.setState({
            suggestions: suggestionsResult.suggestions,
            isShowAll: suggestionsResult.isShowAll
        });
    };

    handleSuggestionsClearRequested = () => {
        const suggestionsResult = this.props.getSuggestions('');
        this.setState({
            suggestions: suggestionsResult.suggestions,
            isShowAll: suggestionsResult.isShowAll
        });
    };

    render() {
        const {
            classes,
            renderInputComponent,
            inputProps,
            getSuggestionValue
        } = this.props;

        return (
            <Autosuggest
                theme={{
                    container: classes.container,
                    suggestionsContainerOpen: classes.suggestionsContainerOpen,
                    suggestionsList: classes.suggestionsList,
                    suggestion: classes.suggestion,
                }}
                renderInputComponent={renderInputComponent}
                inputProps={inputProps}
                suggestions={this.state.suggestions}
                onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
                renderSuggestionsContainer={renderSuggestionsContainer}
                getSuggestionValue={getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
            />
        );
    }
}

AutoComplete.propTypes = {
    classes: PropTypes.object.isRequired,
    renderInputComponent: PropTypes.func.isRequired,
    inputProps: PropTypes.object.isRequired,
    getSuggestions: PropTypes.func.isRequired,
    getSuggestionValue: PropTypes.func.isRequired,
};

export default withStyles(styles)(AutoComplete);
