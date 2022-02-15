import { isProductConfigurable } from '@magento/peregrine/lib/util/isProductConfigurable';
import { findMatchingVariant } from '@magento/peregrine/lib/util/findMatchingProductVariant';

export const getConfigurablePrice = settings => {
    const { product, optionCodes, optionSelections } = settings;
    let value;

    const { variants } = product;
    const isConfigurable = isProductConfigurable(product);

    const optionsSelected =
        Array.from(optionSelections.values()).filter(value => !!value).length >
        0;

    if (isConfigurable && optionsSelected) {
        const item = findMatchingVariant({
            optionCodes,
            optionSelections,
            variants
        });

        value = item
            ? item.product.price.regularPrice.amount
            : product.price.regularPrice.amount;
    } else {
        value = product.price.regularPrice.amount;
    }

    return value;
};


export const getRegularPrice = settings => {
    const { product } = settings;
    const productType = product.__typename;

    switch (productType) {
        case 'ConfigurableProduct':
            return getConfigurablePrice(settings);
        default:
            return getConfigurablePrice(settings);
    }
};
