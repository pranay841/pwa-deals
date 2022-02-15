import React, {useState} from 'react';
import Checkbox from "../../BaseComponents/Checkbox_new";
import _defaultClass from './CheckboxWrapper.module.css'
import OptionLabel from "../../OptionLabel/OptionLabel";

export const CheckboxWrapper = (props) => {
    const {item, handleSelected, getCurrentSelection, extraPrice} = props
    const checkboxKey = item.option_type_id

    const checked = getCurrentSelection(checkboxKey)
    const onClick = () => {
        handleSelected(checkboxKey)
    }
    const priceLabel = <OptionLabel extraPrice={extraPrice} title={''} item={item} classes={_defaultClass}/>

    const colors = {
        checked: '#17D7A0',
        unchecked: '#333'
    }
    return (
        <>
            <div className={_defaultClass.finalWrapper} onClick={onClick}>
                <Checkbox
                    label={item.title}
                    selected={checked}
                    classes={_defaultClass}
                    colors={colors}
                >
                    {priceLabel}
                </Checkbox>
            </div>
        </>
    );
};

