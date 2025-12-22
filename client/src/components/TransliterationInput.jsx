import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const TransliterationInput = ({ value, onChange, placeholder, className, onKeyDown, disabled, multiline = false, rows = 3 }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const [isMalayalam, setIsMalayalam] = useState(true); // Default to Malayalam
    const inputRef = useRef(null);
    const suggestionBoxRef = useRef(null);

    // Debounce timer
    const debounceTimer = useRef(null);

    const fetchSuggestions = async (text) => {
        if (!isMalayalam) return;

        // We only want to transliterate the *last* word being typed
        const words = text.split(/[\s\n]+/);
        const currentWord = words[words.length - 1];

        if (!currentWord || /^[a-zA-Z]+$/.test(currentWord) === false) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const response = await axios.get(
                `https://inputtools.google.com/request?text=${currentWord}&itc=ml-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
            );

            if (response.data && response.data[1] && response.data[1][0] && response.data[1][0][1]) {
                setSuggestions(response.data[1][0][1]);
                setShowSuggestions(true);
                setActiveSuggestionIndex(0);
            }
        } catch (error) {
            console.error("Transliteration error", error);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);

        if (!isMalayalam) return;

        // Simple debounce
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 150);
    };

    const applySuggestion = (suggestion) => {
        const lastWordRegex = /([a-zA-Z]+)$/;
        const match = value.match(lastWordRegex);

        if (match) {
            const newValue = value.slice(0, match.index) + suggestion + ' ';
            onChange(newValue);
        } else {
            // Fallback
            const words = value.split(' ');
            words[words.length - 1] = suggestion;
            onChange(words.join(' ') + ' ');
        }

        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDownInternal = (e) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
                e.preventDefault();
                applySuggestion(suggestions[activeSuggestionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                return;
            }
        }

        if (onKeyDown) onKeyDown(e);
    };

    // Close suggestions if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionBoxRef.current && !suggestionBoxRef.current.contains(event.target) && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleLanguage = () => {
        setIsMalayalam(!isMalayalam);
        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const Component = multiline ? 'textarea' : 'input';

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <Component
                    ref={inputRef}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDownInternal}
                    placeholder={placeholder}
                    className={className}
                    disabled={disabled}
                    autoComplete="off"
                    rows={multiline ? rows : undefined}
                    style={{
                        paddingRight: '40px',
                        width: '100%',
                        borderRadius: '0.375rem',
                        border: '1px solid #e5e7eb',
                        padding: '0.5rem 0.75rem',
                        paddingRight: '40px', // Ensure this overrides standard padding
                        color: '#000000',
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        outline: 'none', // Managed by global focus or add explicit focus style if needed
                        boxSizing: 'border-box'
                    }}
                />

                {/* Language Toggle Button */}
                <button
                    type="button"
                    onClick={toggleLanguage}
                    title={isMalayalam ? "Switch to English" : "Switch to Malayalam"}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: multiline ? '12px' : '50%',
                        transform: multiline ? 'none' : 'translateY(-50%)',
                        background: isMalayalam ? '#f97316' : '#cbd5e0', // Orange-500 : Gray-300
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '4px 6px',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        lineHeight: 1
                    }}
                >
                    {isMalayalam ? 'ML' : 'EN'}
                </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionBoxRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        minWidth: '150px'
                    }}
                >
                    {suggestions.map((s, idx) => (
                        <div
                            key={s}
                            onClick={() => applySuggestion(s)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                backgroundColor: idx === activeSuggestionIndex ? '#e2e8f0' : 'white',
                                color: '#000'
                            }}
                        >
                            <span style={{ fontWeight: 'bold' }}>{s}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransliterationInput;
