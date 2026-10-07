import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => (
  <form className={`space-y-4 ${className}`} {...props}>
    {children}
  </form>
);

export default Form;

