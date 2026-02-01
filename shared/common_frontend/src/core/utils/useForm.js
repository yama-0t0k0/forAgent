import { useState, useCallback } from 'react';

/**
 * useForm - A custom hook for managing form state and validation.
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Object with validation functions for each field
 * @returns {Object} { values, errors, handleChange, handleSubmit, resetForm }
 */
export const useForm = (initialValues = {}, validationRules = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const validate = useCallback((fieldValues = values) => {
        const newErrors = { ...errors };
        Object.keys(validationRules).forEach(field => {
            if (field in fieldValues) {
                const error = validationRules[field](fieldValues[field], fieldValues);
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [values, validationRules, errors]);

    const handleChange = useCallback((field, value) => {
        setValues(prev => {
            const newValues = { ...prev, [field]: value };
            // Optional: re-validate on change
            if (validationRules[field]) {
                const error = validationRules[field](value, newValues);
                setErrors(prevErrors => {
                    const newErrors = { ...prevErrors };
                    if (error) newErrors[field] = error;
                    else delete newErrors[field];
                    return newErrors;
                });
            }
            return newValues;
        });
    }, [validationRules]);

    const handleSubmit = useCallback((onSubmit) => {
        const isValid = validate();
        if (isValid) {
            onSubmit(values);
        }
    }, [values, validate]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    return {
        values,
        errors,
        setValues,
        handleChange,
        handleSubmit,
        resetForm,
        validate
    };
};
