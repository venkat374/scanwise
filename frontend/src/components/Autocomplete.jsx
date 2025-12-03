import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Input from './Input';

import config from "../config";

const Autocomplete = ({ value, onChange, onSelect, placeholder, label, name }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (value.length > 2) {
                try {
                    const response = await axios.get(`${config.API_BASE_URL}/search-products?q=${encodeURIComponent(value)}`);
                    setSuggestions(response.data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [value]);

    const handleSelect = (item) => {
        onSelect(item);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                label={label}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="off"
                name={name}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-card border border-border rounded-xl mt-1 max-h-60 overflow-y-auto shadow-xl">
                    {suggestions.map((item) => (
                        <li
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors"
                        >
                            {item.image_url ? (
                                <img src={item.image_url} alt="" className="w-8 h-8 object-cover rounded" />
                            ) : (
                                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs">?</div>
                            )}
                            <div>
                                <div className="font-medium text-foreground">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground">{item.brands}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Autocomplete;
