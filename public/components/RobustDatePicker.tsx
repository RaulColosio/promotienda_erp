import React, { useRef } from 'react';

interface RobustDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    children: React.ReactNode;
    className?: string;
}

const RobustDatePicker: React.FC<RobustDatePickerProps> = ({ value, onChange, children, className }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        // This is a more reliable way to open the date picker, especially in Chrome
        // where label-based triggering can be inconsistent inside modals.
        if (inputRef.current) {
            try {
                inputRef.current.showPicker();
            } catch (error) {
                console.error("showPicker() is not supported by this browser.", error);
                // As a fallback for older browsers, we could try to focus the input,
                // but for modern ones this is the way.
            }
        }
    };

    return (
        <div onClick={handleClick} className={`cursor-pointer ${className || ''}`} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}>
            {children}
            {/* The input is hidden visually but accessible programmatically via the ref */}
            <input
                ref={inputRef}
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only" // Visually hidden but not display:none
                aria-label="Select date"
                tabIndex={-1} // Remove it from tab order as the wrapper is handling it
            />
        </div>
    );
};

export default RobustDatePicker;