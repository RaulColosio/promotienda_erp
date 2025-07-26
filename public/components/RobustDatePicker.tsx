import React from 'react';

interface RobustDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    children: React.ReactNode;
    className?: string;
    id?: string;
}

const RobustDatePicker: React.FC<RobustDatePickerProps> = ({ value, onChange, children, className, id }) => {
    return (
        <div className={`relative ${className || ''}`}>
            {children}
            <input
                type="date"
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Select date"
            />
        </div>
    );
};

export default RobustDatePicker;
