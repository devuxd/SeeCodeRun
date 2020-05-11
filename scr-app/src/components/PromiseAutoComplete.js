import React from 'react';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import matchSorter from 'match-sorter';


import Autocomplete from '@material-ui/lab/Autocomplete';

export default function PromiseAutoComplete({defaultValue = '', onInputOrOptionChange, getOptionsPromise, filterOptions, ...others}) {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState([]);
    const [value, setValue] = React.useState(defaultValue);
    const loading = open && options.length === 0;

    React.useEffect(() => {
        let active = true;
        if (!loading) {
            return undefined;
        }

        (async () => {
            const response = await getOptionsPromise;
            if (active) {
                setOptions(response);
            }
        })();

        return () => {
            active = false;
        };
    }, [loading]);

    React.useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    return (
        <Autocomplete
            open={open}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            options={options}
            loading={loading}
            renderOption={(option, {inputValue}) => {
                const matches = match(option.label, inputValue);
                const parts = parse(option.label, matches);
                return (
                    <div>
                        {parts.map((part, index) => (
                            <span key={index} style={{fontWeight: part.highlight ? 700 : 400}}>{part.text}</span>
                        ))}
                    </div>
                );
            }}
            value={value}
            onChange={(event, newValue, reason) => {
                const option = newValue ? newValue.inputValue ? {
                        id: value && value.id,
                        label: newValue.inputValue,
                    }
                    : newValue.label ? newValue
                        : {
                            id: null,
                            label: newValue
                        }
                    : {
                        id: null,
                        label: '',
                    };
                setValue(option);
                onInputOrOptionChange && onInputOrOptionChange(event, option, reason);
            }}
            onInputChange={(event, newValue, reason) => {
                if (!event) {
                    return;
                }
                const option = {
                    id: null,
                    label: '',
                };
                switch (reason) {
                    case 'clear':
                        return;
                    case 'reset':
                        option.id = value && value.id;
                        break;
                    case 'input':
                        if (!newValue) { // onChange already triggers clear
                            return;
                        }
                        option.id = value && value.id;
                        option.label = newValue;
                        break;
                    default:
                }
                setValue(option);
                onInputOrOptionChange && onInputOrOptionChange(event, option, reason);
            }}

            getOptionLabel={(option) => {
                // e.g value selected with enter, right from the input
                if (typeof option === 'string') {
                    return option;
                }
                if (option.inputValue) {
                    return option.inputValue;
                }
                return option.label;
            }}

            filterOptions={others.filter ? filterOptions : (options = [], params) => filterOptions(options, {...params, label:value?value.label:""}, matchSorter)}

            {...others}
        />
    );

}

