import React, { Suspense } from 'react';
import { useIntl } from 'react-intl';
import { func } from 'prop-types';

import LoadingIndicator from '@magento/venia-ui/lib/components/LoadingIndicator';
import { useStyle } from '@magento/venia-ui/lib/classify';
import { Accordion, Section } from '@magento/venia-ui/lib/components/Accordion';
import GiftCardSection from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments/giftCardSection';

import defaultClasses from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments/priceAdjustments.module.css';

const CouponCode = React.lazy(() => import('@magento/venia-ui/lib/components/CartPage/PriceAdjustments/CouponCode'));
const GiftOptions = React.lazy(() => import('@magento/venia-ui/lib/components/CartPage/PriceAdjustments/GiftOptions'));
const ShippingMethods = React.lazy(() => import('@magento/venia-ui/lib/components/CartPage/PriceAdjustments/ShippingMethods'));

import { useCartPage } from '@magento/peregrine/lib/talons/CartPage/useCartPage'
/**
 * PriceAdjustments is a child component of the CartPage component.
 * It renders the price adjustments forms for applying gift cards, coupons, and the shipping method.
 * All of which can adjust the cart total.
 *
 * @param {Object} props
 * @param {Function} props.setIsCartUpdating A callback function for setting the updating state of the cart.
 * @param {Object} props.classes CSS className overrides.
 * See [priceAdjustments.module.css]{@link https://github.com/magento/pwa-studio/blob/develop/packages/venia-ui/lib/components/CartPage/PriceAdjustments/priceAdjustments.module.css}
 * for a list of classes you can override.
 *
 * @returns {React.Element}
 *
 * @example <caption>Importing into your project</caption>
 * import PriceAdjustments from '@magento/venia-ui/lib/components/CartPage/PriceAdjustments'
 */
const PriceAdjustments = props => {
    const classes = useStyle(defaultClasses, props.classes);

    const { setIsCartUpdating } = props;
    const { formatMessage } = useIntl();
 

    const talonProps = useCartPage();
    const {
        cartItems,
    } = talonProps;

    let isShippingRequired = false;
    cartItems.forEach(cartItem => {
        if (cartItem.product.__typename === "SimpleProduct") {
            isShippingRequired = true;
        }
    })
  
    return (
        <div className={classes.root}>
            <Accordion canOpenMultiple={true}>
                { isShippingRequired && (<Section
                    id={'shipping_method'}
                    title={formatMessage({
                        id: 'priceAdjustments.shippingMethod',
                        defaultMessage: 'Estimate your Shipping'
                    })}
                >
                    <Suspense fallback={<LoadingIndicator />}>
                        <ShippingMethods
                            setIsCartUpdating={setIsCartUpdating}
                        />
                    </Suspense>
                </Section>)}
                <Section
                    id={'coupon_code'}
                    title={formatMessage({
                        id: 'priceAdjustments.couponCode',
                        defaultMessage: 'Enter Coupon Code'
                    })}
                >
                    <Suspense fallback={<LoadingIndicator />}>
                        <CouponCode setIsCartUpdating={setIsCartUpdating} />
                    </Suspense>
                </Section>
                <GiftCardSection setIsCartUpdating={setIsCartUpdating} />
                <Section
                    id={'gift_options'}
                    title={formatMessage({
                        id: 'priceAdjustments.giftOptions',
                        defaultMessage: 'See Gift Options'
                    })}
                >
                    <Suspense fallback={<LoadingIndicator />}>
                        <GiftOptions />
                    </Suspense>
                </Section>
            </Accordion>
        </div>
    );
};

export default PriceAdjustments;

PriceAdjustments.propTypes = {
    setIsCartUpdating: func
};
