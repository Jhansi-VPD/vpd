import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
}

export default function Icon({ name, className = '', ...rest }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`} {...rest}>
      {name}
    </span>
  );
}
