import { useCallback, useState, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useMutation, useQuery } from '@apollo/client';
import { useCartContext } from '@magento/peregrine/lib/context/cart';
import { useUserContext } from '@magento/peregrine/lib/context/user';

import { appendOptionsToPayload } from '@magento/peregrine/lib/util/appendOptionsToPayload';
import { findMatchingVariant } from '@magento/peregrine/lib/util/findMatchingProductVariant';
import { isProductConfigurable } from '@magento/peregrine/lib/util/isProductConfigurable';
import { isSupportedProductType as isSupported } from '@magento/peregrine/lib/util/isSupportedProductType';
import { deriveErrorMessage } from '@magento/peregrine/lib/util/deriveErrorMessage';
import mergeOperations from '@magento/peregrine/lib/util/shallowMerge';
import defaultOperations from './ProductFullDetail/productFullDetail.gql';
import { formatCustomOptions } from '../components/ProductDetails/Ui/utils/formatCustomOptions';
import { mergeCustomOption } from '../components/ProductDetails/Ui/utils/mergeCustomOption';
import { useSubOptions } from './useSubOptions';
import {isDownloadableLinkRequired} from "../components/ProductDetails/DownloadOption/utils/isDownloadableLinkRequired";
import { getDisplayPrice, getFromToBundlePrice } from './getDisplayPrice';
import { getRegularPrice } from './getRegularPrice';

const INITIAL_OPTION_CODES = new Map();
const INITIAL_OPTION_SELECTIONS = new Map();
const OUT_OF_STOCK_CODE = 'OUT_OF_STOCK';

const deriveOptionCodesFromProduct = product => {
    // If this is a simple product it has no option codes.
    if (!isProductConfigurable(product)) {
        return INITIAL_OPTION_CODES;
    }

    // Initialize optionCodes based on the options of the product.
    const initialOptionCodes = new Map();
    for (const {
        attribute_id,
        attribute_code
    } of product.configurable_options) {
        initialOptionCodes.set(attribute_id, attribute_code);
    }

    return initialOptionCodes;
};

// Similar to deriving the initial codes for each option.
const deriveOptionSelectionsFromProduct = product => {
    if (!isProductConfigurable(product)) {
        return INITIAL_OPTION_SELECTIONS;
    }

    const initialOptionSelections = new Map();
    for (const { attribute_id } of product.configurable_options) {
        initialOptionSelections.set(attribute_id, undefined);
    }

    return initialOptionSelections;
};

const getIsMissingOptions = (product, optionSelections) => {
    // Non-configurable products can't be missing options.
    if (!isProductConfigurable(product)) {
        return false;
    }

    // Configurable products are missing options if we have fewer
    // option selections than the product has options.
    const { configurable_options } = product;
    const numProductOptions = configurable_options.length;
    const numProductSelections = Array.from(optionSelections.values()).filter(
        value => !!value
    ).length;

    return numProductSelections < numProductOptions;
};

const getIsOutOfStock = (product, optionCodes, optionSelections) => {
    const { stock_status, variants } = product;
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

        return item.product.stock_status === OUT_OF_STOCK_CODE;
    }
    return stock_status === OUT_OF_STOCK_CODE;
};

const getMediaGalleryEntries = (product, optionCodes, optionSelections) => {
    let value = [];

    const { media_gallery_entries, variants } = product;
    const isConfigurable = isProductConfigurable(product);

    // Selections are initialized to "code => undefined". Once we select a value, like color, the selections change. This filters out unselected options.
    const optionsSelected =
        Array.from(optionSelections.values()).filter(value => !!value).length >
        0;

    if (!isConfigurable || !optionsSelected) {
        value = media_gallery_entries;
    } else {
        // If any of the possible variants matches the selection add that
        // variant's image to the media gallery. NOTE: This _can_, and does,
        // include variants such as size. If Magento is configured to display
        // an image for a size attribute, it will render that image.
        const item = findMatchingVariant({
            optionCodes,
            optionSelections,
            variants
        });

        value = item
            ? [...item.product.media_gallery_entries, ...media_gallery_entries]
            : media_gallery_entries;
    }

    return value;
};

// We only want to display breadcrumbs for one category on a PDP even if a
// product has multiple related categories. This function filters and selects
// one category id for that purpose.
const getBreadcrumbCategoryId = categories => {
    // Exit if there are no categories for this product.
    if (!categories || !categories.length) {
        return;
    }
    const breadcrumbSet = new Set();
    categories.forEach(({ breadcrumbs }) => {
        // breadcrumbs can be `null`...
        (breadcrumbs || []).forEach(({ category_id }) =>
            breadcrumbSet.add(category_id)
        );
    });

    // Until we can get the single canonical breadcrumb path to a product we
    // will just return the first category id of the potential leaf categories.
    const leafCategory = categories.find(
        category => !breadcrumbSet.has(category.id)
    );

    // If we couldn't find a leaf category then just use the first category
    // in the list for this product.
    return leafCategory.id || categories[0].id;
};

const getConfigPrice = (product, optionCodes, optionSelections) => {
    let value;

    const { variants } = product;
    const isConfigurable = isProductConfigurable(product);

    const optionsSelected =
        Array.from(optionSelections.values()).filter(value => !!value).length >
        0;

    if (!isConfigurable || !optionsSelected) {
        value = product.price.regularPrice.amount;
    } else {
        const item = findMatchingVariant({
            optionCodes,
            optionSelections,
            variants
        });

        value = item
            ? item.product.price.regularPrice.amount
            : product.price.regularPrice.amount;
    }

    return value;
};

/**
 * @param {GraphQLDocument} props.addConfigurableProductToCartMutation - configurable product mutation
 * @param {GraphQLDocument} props.addSimpleProductToCartMutation - configurable product mutation
 * @param {Object.<string, GraphQLDocument>} props.operations - collection of operation overrides merged into defaults
 * @param {Object} props.product - the product, see RootComponents/Product
 *
 * @returns {{
 *  breadcrumbCategoryId: string|undefined,
 *  errorMessage: string|undefined,
 *  handleAddToCart: func,
 *  handleSelectionChange: func,
 *  handleSetQuantity: func,
 *  isAddToCartDisabled: boolean,
 *  isSupportedProductType: boolean,
 *  mediaGalleryEntries: array,
 *  productDetails: object,
 *  quantity: number
 * }}
 */
export const useProductFullDetail = props => {
    const {
        addConfigurableProductToCartMutation,
        addSimpleProductToCartMutation,
        product
    } = props;

    const hasDeprecatedOperationProp = !!(
        addConfigurableProductToCartMutation || addSimpleProductToCartMutation
    );

    const operations = mergeOperations(defaultOperations, props.operations);

    const productType = product.__typename;

    const isSupportedProductType = isSupported(productType);

    const [{ cartId }] = useCartContext();
    const [{ isSignedIn }] = useUserContext();
    const { formatMessage } = useIntl();

    const { data: storeConfigData } = useQuery(
        operations.getWishlistConfigQuery,
        {
            fetchPolicy: 'cache-and-network'
        }
    );

    const [
        addConfigurableProductToCart,
        {
            error: errorAddingConfigurableProduct,
            loading: isAddConfigurableLoading
        }
    ] = useMutation(
        addConfigurableProductToCartMutation ||
            operations.addConfigurableProductToCartMutation
    );

    const [
        addSimpleProductToCart,
        { error: errorAddingSimpleProduct, loading: isAddSimpleLoading }
    ] = useMutation(
        addSimpleProductToCartMutation ||
            operations.addSimpleProductToCartMutation
    );

    const [
        addDownloadableProductToCart,
        {
            error: errorAddingDownloadableProduct,
            loading: isAddDownloadableLoading
        }
    ] = useMutation(operations.addDownloadableProductToCartMutation);

    const [
        addVirtualProductsToCart,
        {
            error: errorAddingVirtualProduct,
            loading: isAddVirtualLoading
        }
    ] = useMutation(operations.addVirtualProductToCartMutation);


    const [
        addProductToCart,
        { error: errorAddingProductToCart, loading: isAddProductLoading }
    ] = useMutation(operations.addProductToCartMutation);

    const breadcrumbCategoryId = useMemo(
        () => getBreadcrumbCategoryId(product.categories),
        [product.categories]
    );

    const derivedOptionSelections = useMemo(
        () => deriveOptionSelectionsFromProduct(product),
        [product]
    );

    const [optionSelections, setOptionSelections] = useState(
        derivedOptionSelections
    );

    const {
        options: customOptions,
        getCurrentValue: getCurrentCustomValue,
        handleOptionsChange: handleCustomOptionsChange
    } = useSubOptions();

    const fCus = useMemo(() => formatCustomOptions(customOptions), [
        customOptions
    ]);

    const isAllRequiredCustomFieldFilled = useMemo(() => {
        const requiredCustomOption = (product.options || []).filter(
            x => x.required
        );
        const requiredOptionUid = requiredCustomOption.map(
            option => option.uid
        );
        return requiredOptionUid.reduce((acc, uid) => {
            return acc && !!customOptions[uid];
        }, true);
        // return fCus.length >= requiredCustomOptionLength;
    }, [product, fCus]);

    // const fGroup = useMemo(() => formatCustomOptions(groupedOptions), [
    //     groupedOptions
    // ]);

    const {
        options: downloadableOptions,
        getCurrentValue: getCurrentDownloadableValue,
        handleOptionsChange: handleDownloadableOptionsChange
    } = useSubOptions();

    const selectedDownloadLink = useMemo(() => {
        return Object.values(downloadableOptions)
            .filter(x => !!x)
            .reduce((acc, cur) => acc.concat(cur), []);
    }, [downloadableOptions]);

    const isAllRequiredDownloadableFieldFilled = isDownloadableLinkRequired(
        product
    )
        ? selectedDownloadLink.length > 0 
        : true; //atleast 1 checkbox for downloadable data is clicked
    

    const derivedOptionCodes = useMemo(
        () => deriveOptionCodesFromProduct(product),
        [product]
    );
    const [optionCodes] = useState(derivedOptionCodes);

    const isMissingOptions = useMemo(
        () => getIsMissingOptions(product, optionSelections),
        [product, optionSelections]
    );

    const isOutOfStock = useMemo(
        () => getIsOutOfStock(product, optionCodes, optionSelections),
        [product, optionCodes, optionSelections]
    );

    const mediaGalleryEntries = useMemo(
        () => getMediaGalleryEntries(product, optionCodes, optionSelections),
        [product, optionCodes, optionSelections]
    );

    // The map of ids to values (and their uids)
    // For example:
    // { "179" => [{ uid: "abc", value_index: 1 }, { uid: "def", value_index: 2 }]}
    const attributeIdToValuesMap = useMemo(() => {
        const map = new Map();
        // For simple items, this will be an empty map.
        const options = product.configurable_options || [];
        for (const { attribute_id, values } of options) {
            map.set(attribute_id, values);
        }
        return map;
    }, [product.configurable_options]);

    // An array of selected option uids. Useful for passing to mutations.
    // For example:
    // ["abc", "def"]
    const selectedOptionsArray = useMemo(() => {
        const selectedOptions = [];

        optionSelections.forEach((value, key) => {
            const values = attributeIdToValuesMap.get(key);

            const selectedValue = values.find(
                item => item.value_index === value
            );

            if (selectedValue) {
                selectedOptions.push(selectedValue.uid);
            }
        });
        return selectedOptions;
    }, [attributeIdToValuesMap, optionSelections]);

    const handleAddToCart = useCallback(
        async formValues => {
            const { quantity } = formValues;
            /*
                @deprecated in favor of general addProductsToCart mutation. Will support until the next MAJOR.
             */
            if (hasDeprecatedOperationProp) {
                /* no deprecated operation supported anymore */
                console.error('Unsupported product type. Cannot add to cart.');
            } else {
                const payload = {
                    item: product,
                    productType,
                    quantity
                };
                const _variables = {
                    cartId,
                    product: {
                        sku: product.sku,
                        quantity
                    },
                    entered_options: [
                        {
                            uid: product.uid,
                            value: product.name
                        }
                    ]
                };

                const variables = isAllRequiredCustomFieldFilled
                    ? mergeCustomOption(_variables, fCus)
                    : _variables;

                if (selectedOptionsArray.length) {
                    variables.product.selected_options = selectedOptionsArray;
                }
                if (productType === 'DownloadableProduct') {
                    // downloadable graph is different, so we need to modify variables shape
                    const downloadableVariable = {
                        ...variables,
                        product: {
                            data: {
                                ..._variables.product
                            },
                            downloadable_product_links: selectedDownloadLink.map(
                                id => ({
                                    link_id: id
                                })
                            )
                        }
                    };

                    try {
                        await addDownloadableProductToCart({
                            variables: downloadableVariable
                        });
                    } catch (e) {
                        console.warn(e);
                    }
                }else if (productType === 'SimpleProduct') {
                    const variables = {
                        cartId,
                        parentSku: payload.parentSku,
                        product: payload.item,
                        quantity: payload.quantity,
                        sku: payload.item.sku
                    };
                    try {
                        await addSimpleProductToCart({
                            variables
                        });
                    } catch {
                        return;
                    }
                }  
                else if (productType === 'VirtualProduct') {
                    const virtualProduct = {
                        cartId,
                        quantity: payload.quantity,
                        sku: payload.item.sku
                    };

                    try {
                        await addVirtualProductsToCart({
                            variables: virtualProduct
                        });
                    } catch (e) {
                        console.warn(e);
                    }
                }
                else if (productType === 'ConfigurableProduct') {
                    appendOptionsToPayload(
                        payload,
                        optionSelections,
                        optionCodes
                    );
                    const variables = {
                        cartId,
                        parentSku: payload.parentSku,
                        product: payload.item,
                        quantity: payload.quantity,
                        sku: payload.item.sku
                    };
                    try {
                        await addConfigurableProductToCart({
                            variables
                        });
                    } catch {
                        return;
                    }
                }else {
                    variables.product = [variables.product];
                    try {
                        await addProductToCart({ variables });
                    } catch {
                        return;
                    }
                }
            }
        },
        [
            addConfigurableProductToCart,
            addProductToCart,
            addSimpleProductToCart,
            addDownloadableProductToCart,
            addVirtualProductsToCart,
            selectedDownloadLink,
            cartId,
            hasDeprecatedOperationProp,
            isSupportedProductType,
            optionCodes,
            optionSelections,
            product,
            productType,
            selectedOptionsArray,
            fCus,
            // fGroup,
            isAllRequiredCustomFieldFilled,
        ]
    );

    const handleSelectionChange = useCallback(
        (optionId, selection) => {
            // We must create a new Map here so that React knows that the value
            // of optionSelections has changed.
            const nextOptionSelections = new Map([...optionSelections]);
            nextOptionSelections.set(optionId, selection);
            setOptionSelections(nextOptionSelections);
        },
        [optionSelections]
    );

    // const productPrice = useMemo(
    //     () => getConfigPrice(product, optionCodes, optionSelections),
    //     [product, optionCodes, optionSelections]
    // );
    const extraPrice = useMemo(
        () =>
            getDisplayPrice({
                product,
                optionCodes,
                optionSelections,
                customOptions,
                downloadableOptions,
            }),
        [
            product,
            optionCodes,
            optionSelections,
            customOptions,
            downloadableOptions,
        ]
    );

    let regularPrice = 0; 
    if(product.__typename === 'ConfigurableProduct') {
        regularPrice = useMemo(
            () =>
                getRegularPrice({
                    product,
                    optionCodes,
                    optionSelections,
                    customOptions,
                    downloadableOptions,
                }),
            [
                product,
                optionCodes,
                optionSelections,
                customOptions,
                downloadableOptions,
            ]
        );
    }
    const productPrice = extraPrice;

    const switchExtraPriceForNormalPrice = [
        'DownloadableProduct',
        // 'GroupedProduct'
    ].includes(productType);

    // Normalization object for product details we need for rendering.
    const productDetails = {
        description: product.description,
        short_description: product.short_description,
        name: product.name,
        price: productPrice,
        priceRegular: regularPrice,
        sku: product.sku
    };

    const derivedErrorMessage = useMemo(
        () =>
            deriveErrorMessage([
                errorAddingSimpleProduct,
                errorAddingConfigurableProduct,
                errorAddingProductToCart,
                errorAddingDownloadableProduct,
                errorAddingVirtualProduct
            ]),
        [
            errorAddingConfigurableProduct,
            errorAddingProductToCart,
            errorAddingSimpleProduct,
            errorAddingDownloadableProduct,
            errorAddingVirtualProduct

        ]
    );

    const wishlistItemOptions = useMemo(() => {
        const options = {
            quantity: 1,
            sku: product.sku
        };

        if (productType === 'ConfigurableProduct') {
            options.selected_options = selectedOptionsArray;
        }

        return options;
    }, [product, productType, selectedOptionsArray]);

    const wishlistButtonProps = {
        buttonText: isSelected =>
            isSelected
                ? formatMessage({
                      id: 'wishlistButton.addedText',
                      defaultMessage: 'Added to Favorites'
                  })
                : formatMessage({
                      id: 'wishlistButton.addText',
                      defaultMessage: 'Add to Favorites'
                  }),
        item: wishlistItemOptions,
        storeConfig: storeConfigData ? storeConfigData.storeConfig : {}
    };

    return {
        breadcrumbCategoryId,
        errorMessage: derivedErrorMessage,
        handleAddToCart,
        handleSelectionChange,
        isOutOfStock,
        isAddToCartDisabled:
            isOutOfStock ||
            isMissingOptions ||
            isAddConfigurableLoading ||
            isAddDownloadableLoading ||
            isAddVirtualLoading||
            isAddSimpleLoading ||
            !isAllRequiredCustomFieldFilled ||
            !isAllRequiredDownloadableFieldFilled ||
            isAddProductLoading,
        isSupportedProductType,
        mediaGalleryEntries,
        shouldShowWishlistButton:
            isSignedIn &&
            storeConfigData &&
            !!storeConfigData.storeConfig.magento_wishlist_general_is_enabled,
        productDetails,
        wishlistButtonProps,
        wishlistItemOptions,
        customOptions,
        // groupedOptions,
        handleCustomOptionsChange,
        getCurrentCustomValue,
        downloadableOptions,
        getCurrentDownloadableValue,
        handleDownloadableOptionsChange,
        extraPrice,
        switchExtraPriceForNormalPrice
    };
};
