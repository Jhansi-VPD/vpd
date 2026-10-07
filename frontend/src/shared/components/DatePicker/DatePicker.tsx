import React from 'react';
import Input from '../Input';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = (props) => {
  return <Input type="date" {...props} />;
};

export default DatePicker;

