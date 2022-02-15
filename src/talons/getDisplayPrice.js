import { isProductConfigurable } from '@magento/peregrine/lib/util/isProductConfigurable';
import { findMatchingVariant } from '@magento/peregrine/lib/util/findMatchingProductVariant';
import { getInternalCustomOptionValueObject } from '../override/lib/util/getInternalCustomOptionValueObject';

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
            ? item.product.price.minimalPrice.amount
            : product.price.minimalPrice.amount;
    } else {
        value = product.price.minimalPrice.amount;
    }

    return value;
};

export const getAdditionalPriceFromSubCustomOption = (option, basePrice) => {
    const { price_type, price } = option;
    if (price_type === 'FIXED') {
        return price;
    } else {
        // percent price
        return basePrice * (price / 100);
    }
};

export const getCustomPrice = settings => {
    const { product, customOptions: chosenCustomOptions } = settings;

    const originalPriceObject = product.price.regularPrice.amount;

    const regularPrice = product.price.regularPrice;
    const regularAmount = regularPrice.amount.value;

    const customOptions = product.options || [];
    const chosenCustomOptionUidArray = Object.keys(chosenCustomOptions).filter(
        key => !!chosenCustomOptions[key]
    );

    const matchingSelectedOptions = customOptions
        .filter(option => chosenCustomOptionUidArray.includes(option.uid))
        .map(option => getInternalCustomOptionValueObject(option));

    const additionalPrice = matchingSelectedOptions.reduce((acc, cur) => {
        const { key, value: option } = cur;

        if (option instanceof Array) {
            // multi value
            const selectedSubOptions = option.filter(op => {
                return (
                    (chosenCustomOptions[key] || []).includes(
                        op.option_type_id
                    ) ||
                    (chosenCustomOptions[key] || []).includes(
                        String(op.option_type_id)
                    )
                );
            });
            return (
                acc +
                selectedSubOptions.reduce((acc_1, op) => {
                    return (
                        acc_1 +
                        getAdditionalPriceFromSubCustomOption(op, regularAmount)
                    );
                }, 0)
            );
        } else {
            try {
                return (
                    acc +
                    getAdditionalPriceFromSubCustomOption(option, regularAmount)
                );
            } catch (e) {
                return acc;
            }
        }
    }, 0);

    return { ...originalPriceObject, value: regularAmount + additionalPrice };
};


export const getDownloadablePrice = settings => {
    const { product, downloadableOptions } = settings;
    const originalPriceObject = product.price.regularPrice.amount;
    let minimalPrice = product.price.minimalPrice.amount.value;
    const downloadableLinks = product.downloadable_product_links;

    const selectedDownloadable = Object.values(downloadableOptions)
        .filter(v => !!v)
        .map(downloadOptionId =>
            downloadableLinks.find(
                link => parseInt(link.id) === parseInt(downloadOptionId)
            )
        );

    const additionalDownloadablePrice = selectedDownloadable.reduce(
        (acc, cur) => {
            return acc + cur.price;
        },
        minimalPrice
    );

    return { ...originalPriceObject, value: additionalDownloadablePrice };
};

export const getDisplayPrice = settings => {
    const { product } = settings;
    const productType = product.__typename;

    switch (productType) {
        case 'ConfigurableProduct':
            return getConfigurablePrice(settings);
        case 'SimpleProduct':
            return getCustomPrice(settings);
        // case 'BundleProduct':
        //     return getBundlePrice(settings);
        case 'DownloadableProduct':
            return getDownloadablePrice(settings);
        // case 'GroupedProduct':
        //     return getGroupedPrice(settings);
        default:
            return getConfigurablePrice(settings);
    }
};
