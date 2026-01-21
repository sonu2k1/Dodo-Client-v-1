import { useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';

/**
 * GlassInput - Reusable glassmorphism input component
 * 
 * @param {Object} props
 * @param {string} props.type - Input type (text, email, password, number, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.error - Error state
 * @param {string} props.errorMessage - Error message
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.glowColor - Glow color on focus
 * @param {React.ReactNode} props.icon - Left icon
 * @param {string} props.className - Additional CSS classes
 */
const GlassInput = forwardRef(({
    type = 'text',
    placeholder = '',
    label = '',
    value,
    onChange,
    error = false,
    errorMessage = '',
    disabled = false,
    glowColor = 'blue',
    icon = null,
    className = '',
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const glowColors = {
        blue: 'focus:shadow-[0_0_20px_rgba(0,212,255,0.3)] focus:border-[rgba(0,212,255,0.4)]',
        purple: 'focus:shadow-[0_0_20px_rgba(180,0,255,0.3)] focus:border-[rgba(180,0,255,0.4)]',
        pink: 'focus:shadow-[0_0_20px_rgba(255,0,229,0.3)] focus:border-[rgba(255,0,229,0.4)]',
        cyan: 'focus:shadow-[0_0_20px_rgba(0,255,249,0.3)] focus:border-[rgba(0,255,249,0.4)]',
        green: 'focus:shadow-[0_0_20px_rgba(0,255,136,0.3)] focus:border-[rgba(0,255,136,0.4)]',
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const inputClasses = `
    w-full
    backdrop-blur-[20px]
    bg-[rgba(255,255,255,0.05)]
    border border-[rgba(255,255,255,0.12)]
    rounded-xl
    px-4 py-3
    ${icon ? 'pl-12' : ''}
    ${type === 'password' ? 'pr-12' : ''}
    text-white
    placeholder-gray-400
    outline-none
    transition-all duration-300 ease-in-out
    ${error ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.3)]' : glowColors[glowColor]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}

                <input
                    ref={ref}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClasses}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>

            {error && errorMessage && (
                <p className="mt-2 text-sm text-red-400">
                    {errorMessage}
                </p>
            )}
        </div>
    );
});

GlassInput.displayName = 'GlassInput';

GlassInput.propTypes = {
    type: PropTypes.string,
    placeholder: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    error: PropTypes.bool,
    errorMessage: PropTypes.string,
    disabled: PropTypes.bool,
    glowColor: PropTypes.oneOf(['blue', 'purple', 'pink', 'cyan', 'green']),
    icon: PropTypes.node,
    className: PropTypes.string,
};

export default GlassInput;
