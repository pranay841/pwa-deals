import React from 'react';
import { useBaseInput } from '../../../Ui/utils/useBaseInput';
import { CheckboxWrapper } from '../../../../Helper/OptionContent/MultipleCheckbox/CheckboxWrapper';

export const MiniOption = props => {
    const { item, useProductFullDetailProps } = props;
    const {
        getCurrentDownloadableValue,
        handleDownloadableOptionsChange,
        extraPrice
    } = useProductFullDetailProps;

    const { handleSelected, getCurrentSelection } = useBaseInput({
        ...props,
        _keyToFormState: item.id,
        _getFieldName: item => item.id,
        canPickMultiple: true,
        _handleCustomOptionsChange: handleDownloadableOptionsChange,
        _getCurrentCustomValue: getCurrentDownloadableValue
    });

    return (
        <CheckboxWrapper
            extraPrice={extraPrice}
            item={{ ...item, option_type_id: item.id }}
            handleSelected={handleSelected}
            getCurrentSelection={getCurrentSelection}
        />
    );
};