/**
 * Utility functions for handling slider value changes
 */

/**
 * Handles slider value changes for single-value sliders
 * Converts MUI Slider's newValue (number | number[]) to a single number
 * @param newValue - The new value from MUI Slider (can be number or array)
 * @param setter - The state setter function
 */
export function handleSliderChange(newValue: number | number[], setter: (value: number) => void) {
  const value = Array.isArray(newValue) ? newValue[0] : newValue;
  setter(value);
}

/**
 * Creates a handler function for slider changes
 * @param setter - The state setter function
 * @returns A handler function compatible with MUI Slider's onChange
 */
export function createSliderHandler(setter: (value: number) => void) {
  return (_: Event | null, newValue: number | number[]) => {
    handleSliderChange(newValue, setter);
  };
}
