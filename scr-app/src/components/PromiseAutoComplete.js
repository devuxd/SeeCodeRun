import React, {useState, useEffect, useMemo, useCallback} from 'react';

import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import {matchSorter} from 'match-sorter';

import Autocomplete from '@mui/material/Autocomplete';
import Popper from '@mui/material/Popper';

export default function PromiseAutoComplete({
                                                defaultValue = '',
                                                onInputOrOptionChange,
                                                getOptionsPromise,
                                                filterOptions,
                                                PopperProps,
                                                ...others
                                            }) {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState([]);
    const [value, setValue] = useState(defaultValue);
    const loading = open && options.length === 0;
    const handleChangeOpen = useCallback(() => {
        setOpen(true);
    }, [setOpen]);
    const handleChangeClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);

    useEffect(() => {
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
    }, [loading, getOptionsPromise]);

    useEffect(() => {
        if (!open) {
            setOptions([]);
        }
    }, [open]);

    const renderOption = useCallback((props, option, {inputValue}) => {
            const matches = match(option.label, inputValue);
            const parts = parse(option.label, matches);
            return (
                <li {...props}>
                    {parts.map((part, index) => (
                        <span key={index}
                              style={{fontWeight: part.highlight ? 700 : 400}}
                        >
                            {part.text}
                        </span>
                    ))}
                </li>
            );
        },
        []);

    const onChange = useCallback((event, newValue, reason) => {
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
            onInputOrOptionChange
            && onInputOrOptionChange(event, option, reason);
        },
        [value, setValue, onInputOrOptionChange]);

    const onInputChange = useCallback((event, newValue, reason) => {
            if (!event) {
                return;
            }
            const option = {
                id: null,
                label: '',
            };
            switch (reason) {
                case 'clear':
                    break;
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
            onInputOrOptionChange
            && onInputOrOptionChange(event, option, reason);
        },
        [value, setValue, onInputOrOptionChange]);

    const getOptionLabel = useCallback((option) => {
            // e.g value selected with enter, right from the input
            if (typeof option === 'string') {
                return option;
            }
            if (option.inputValue) {
                return option.inputValue;
            }
            return option.label;
        }
        , []);

    const othersFilter = others && others.filter;

    const finalFilterOptions = useMemo(() => {
        return othersFilter ? filterOptions
            : (options = [], params) => filterOptions(options, {
                ...params,
                label: value ? value.label : ""
            }, matchSorter);
    }, [othersFilter, filterOptions, value]);

    const CustomPopper = useCallback(props => (
        <Popper {...props}
                {...PopperProps}
        />
    ), [PopperProps]);

    return (
        <Autocomplete
            PopperComponent={CustomPopper}
            open={open}
            onOpen={handleChangeOpen}
            onClose={handleChangeClose}
            options={options}
            loading={loading}
            renderOption={renderOption}
            value={value}
            onChange={onChange}
            onInputChange={onInputChange}
            getOptionLabel={getOptionLabel}
            filterOptions={finalFilterOptions}

            {...others}
        />
    )
        ;

}
