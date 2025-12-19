import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Input from './Input';

import config from "../config";

const Autocomplete = ({ value, onChange, onSelect, placeholder, label, name }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);
    const isSelecting = useRef(false);
    const lastRequestDesc = useRef("");

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
            // If this update was triggered by a selection, ignore it
            if (isSelecting.current) {
                isSelecting.current = false;
                setShowSuggestions(false);
                return;
            }

            if (value.length > 2) {
                const currentRequest = value;
                lastRequestDesc.current = currentRequest;
                
                try {
                    const response = await axios.get(`${config.API_BASE_URL}/search-products?q=${encodeURIComponent(value)}`);
                    
                    // Race condition check: Only update if the value hasn't changed since we asked
                    // AND if we aren't currently in a selected state (user might have selected while waiting)
                    if (currentRequest === value && !isSelecting.current) {
                        setSuggestions(response.data);
                        setShowSuggestions(true);
                    }
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
        isSelecting.current = true;
        
        // Clear suggestions immediately to prevent flashing
        setSuggestions([]); 
        setShowSuggestions(false);
        
        onSelect(item);
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
                <ul className="absolute z-[9999] w-full bg-white dark:bg-zinc-900 border border-border rounded-xl mt-1 max-h-[300px] overflow-y-auto shadow-2xl">
                    {suggestions.map((item) => (
                        <li
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-3 transition-colors border-b border-border/50 last:border-0"
                        >
                            {item.image_url ? (
                                <img src={item.image_url} alt="" className="w-10 h-10 object-cover rounded-md flex-shrink-0 bg-white" />
                            ) : (
                                <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-xs flex-shrink-0">?</div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground truncate">{item.brands}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Autocomplete;
