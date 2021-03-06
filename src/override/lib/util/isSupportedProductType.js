const SUPPORTED_PRODUCT_TYPES = ['SimpleProduct', 'ConfigurableProduct', 'DownloadableProduct', 'VirtualProduct', 'GroupedProduct', 'BundleProduct'];

export const isSupportedProductType = productType => {
    return SUPPORTED_PRODUCT_TYPES.includes(productType);
};
