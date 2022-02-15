/**
 * Mappings for overwrites
 * example: [`@magento/venia-ui/lib/components/Main/main.js`]: './lib/components/Main/main.js'
 */
module.exports = componentOverride = {
    ['@magento/peregrine/lib/util/isSupportedProductType.js']: './override/lib/util/isSupportedProductType.js',
    ['@magento/venia-ui/lib/components/CartPage/PriceAdjustments/priceAdjustments.js']: './override/lib/components/priceAdjustments.js',
    ['@magento/venia-ui/lib/components/CheckoutPage/OrderConfirmationPage/orderConfirmationPage.js']: './override/lib/components/orderConfirmationPage.js',
    ['@magento/venia-ui/lib/components/CheckoutPage/checkoutPage.js']: './override/lib/components/checkoutPage.js',
    ['@magento/venia-ui/lib/components/CheckoutPage/PaymentInformation/creditCard.js']: './override/lib/components/creditCard.js',
    ['@magento/venia-ui/lib/components/Gallery/addToCartButton.js']: './override/lib/components/addToCartButton.js',
    ['@magento/venia-ui/lib/components/ProductFullDetail/productFullDetail.js']: './override/lib/components/productFullDetail.js',
    ['@magento/peregrine/lib/talons/RootComponents/Product/productDetailFragment.gql.js']: '@hbwsl/deals/src/talons/RootComponents/productDetailFragment.gql.js',
    ['@magento/peregrine/lib/talons/AccountMenu/useAccountMenuItems.js']: '@hbwsl/deals/src/talons/AccountMenu/useAccountMenuItems.js',
    ['@magento/venia-ui/lib/components/Gallery/item.js']: './override/lib/components/item.js',
    [`@magento/peregrine/lib/talons/OrderHistoryPage/useOrderRow.js`]: '@hbwsl/deals/src/talons/OrderHistoryPage/useOrderRow.js',
    [`@magento/peregrine/lib/talons/RootComponents/Category/categoryFragments.gql.js`]: '@hbwsl/deals/src/talons/RootComponents/Category/categoryFragments.gql.js',
    [`@magento/pagebuilder/lib/ContentTypes/Products/products.js`]: '@hbwsl/deals/src/talons/pageBuilder/lib/ContentTypes/Products/products.js',
    [`@magento/venia-ui/lib/components/ProductOptions/option.module.css`]: '@hbwsl/deals/src/override/lib/components/styles/option.module.css'
};
