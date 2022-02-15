import React from 'react';

const defaultStyle = {marginLeft: '5px', color: '#ff0000'}

export const RequiredLabel = (props) => {
    return (
        <span className="required-label" style={defaultStyle}>*</span>
    );
};
