import React, { Fragment, Suspense, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { arrayOf, bool, number, shape, string } from 'prop-types';
import { Form } from 'informed';
import { Info } from 'react-feather';

import Price from '@magento/venia-ui/lib/components/Price';
import { useProductFullDetail } from '../../../talons/useProductFullDetail';
import { isProductConfigurable } from '@magento/peregrine/lib/util/isProductConfigurable';

import { useStyle } from '@magento/venia-ui/lib/classify';
import Breadcrumbs from '@magento/venia-ui/lib/components/Breadcrumbs';
import Button from '@magento/venia-ui/lib/components/Button';
import Carousel from '@magento/venia-ui/lib/components/ProductImageCarousel';
import FormError from '@magento/venia-ui/lib/components/FormError';
import { QuantityFields } from '@magento/venia-ui/lib/components/CartPage/ProductListing/quantity';
import RichContent from '@magento/venia-ui/lib/components/RichContent/richContent';
import { ProductOptionsShimmer } from '@magento/venia-ui/lib/components/ProductOptions';
import defaultClasses from '@magento/venia-ui/lib/components/ProductFullDetail/productFullDetail.module.css';

const WishlistButton = React.lazy(() => import('@magento/venia-ui/lib/components/Wishlist/AddToListButton'));
const Options = React.lazy(() => import('@magento/venia-ui/lib/components/ProductOptions'));

const ProductDetails = React.lazy(() => import('../../../components/ProductDetails'));

import customClasses from './styles/productFullDetails.scss';

// Correlate a GQL error message to a field. GQL could return a longer error
// string but it may contain contextual info such as product id. We can use
// parts of the string to check for which field to apply the error.
const ERROR_MESSAGE_TO_FIELD_MAPPING = {
    'The requested qty is not available': 'quantity',
    'Product that you are trying to add is not available.': 'quantity',
    "The product that was requested doesn't exist.": 'quantity'
};

// Field level error messages for rendering.
const ERROR_FIELD_TO_MESSAGE_MAPPING = {
    quantity: 'The requested quantity is not available.'
};

const ProductFullDetail = props => {
    const { product } = props;

    const talonProps = useProductFullDetail({ product });

    const {
        breadcrumbCategoryId,
        errorMessage,
        handleAddToCart,
        handleSelectionChange,
        isOutOfStock,
        isAddToCartDisabled,
        isSupportedProductType,
        mediaGalleryEntries,
        productDetails,
        wishlistButtonProps,
        extraPrice,
        switchExtraPriceForNormalPrice
    } = talonProps;
    const { formatMessage } = useIntl();

    const classes = useStyle(defaultClasses, props.classes, customClasses);

    const options = isProductConfigurable(product) ? (
        <Suspense fallback={<ProductOptionsShimmer />}>
            <Options
                onSelectionChange={handleSelectionChange}
                options={product.configurable_options}
            />
        </Suspense>
    ) : product.__typename === 'DownloadableProduct' ?(
        <ProductDetails
            product={product}
            useProductFullDetailProps={talonProps}
        />
    ): null

    const breadcrumbs = breadcrumbCategoryId ? (
        <Breadcrumbs
            categoryId={breadcrumbCategoryId}
            currentProduct={productDetails.name}
        />
    ) : null;

    // Fill a map with field/section -> error.
    const errors = new Map();
    if (errorMessage) {
        Object.keys(ERROR_MESSAGE_TO_FIELD_MAPPING).forEach(key => {
            if (errorMessage.includes(key)) {
                const target = ERROR_MESSAGE_TO_FIELD_MAPPING[key];
                const message = ERROR_FIELD_TO_MESSAGE_MAPPING[target];
                errors.set(target, message);
            }
        });

        // Handle cases where a user token is invalid or expired. Preferably
        // this would be handled elsewhere with an error code and not a string.
        if (errorMessage.includes('The current user cannot')) {
            errors.set('form', [
                new Error(
                    formatMessage({
                        id: 'productFullDetail.errorToken',
                        defaultMessage:
                            'There was a problem with your cart. Please sign in again and try adding the item once more.'
                    })
                )
            ]);
        }

        // Handle cases where a cart wasn't created properly.
        if (
            errorMessage.includes('Variable "$cartId" got invalid value null')
        ) {
            errors.set('form', [
                new Error(
                    formatMessage({
                        id: 'productFullDetail.errorCart',
                        defaultMessage:
                            'There was a problem with your cart. Please refresh the page and try adding the item once more.'
                    })
                )
            ]);
        }

        // An unknown error should still present a readable message.
        if (!errors.size) {
            errors.set('form', [
                new Error(
                    formatMessage({
                        id: 'productFullDetail.errorUnknown',
                        defaultMessage:
                            'Could not add item to cart. Please check required options and try again.'
                    })
                )
            ]);
        }
    }

    const cartCallToActionText = !isOutOfStock ? (
        'Buy Now'
    ) : (
        <FormattedMessage
            id="productFullDetail.itemOutOfStock"
            defaultMessage="Out of Stock"
        />
    );

    const cartActionContent = isSupportedProductType ? (
        <Button className={classes.buyNowBtn} disabled={isAddToCartDisabled} priority="high" type="submit">
            {cartCallToActionText}
        </Button>
    ) : (
        <div className={classes.unavailableContainer}>
            <Info />
            <p>
                <FormattedMessage
                    id={'productFullDetail.unavailableProduct'}
                    defaultMessage={
                        'This product is currently unavailable for purchase.'
                    }
                />
            </p>
        </div>
    );

    const pricePiece = switchExtraPriceForNormalPrice ? (
        <Price currencyCode={extraPrice.currency} value={extraPrice.value} />
    ) : (
        <Price
            currencyCode={productDetails.price.currency}
            value={productDetails.price.value}
            fromValue={productDetails.price.fromValue}
            toValue={productDetails.price.toValue}
        />
    );

    const calculateTimeLeft = () => {
        let year = new Date().getFullYear();
       
        let difference = new Date(product.deal_timer_end_point) - +new Date();
      
        let timeLeft = {};
      
        if (difference > 0) {
          timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            mins: Math.floor((difference / 1000 / 60) % 60),
            secs: Math.floor((difference / 1000) % 60)
          };
        }
      
        return timeLeft;
    }
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
          setTimeLeft(calculateTimeLeft());
        }, 1000);
      
        return () => clearTimeout(timer);
    });

    const timerComponents = [];

    Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
        return;
    }

    timerComponents.push(
        <span className={classes.dealTimeContainer}>
        {timeLeft[interval]} {interval}{" "}
        </span>
    );
    });

    let finalPrice = pricePiece;

    if(product.__typename === 'ConfigurableProduct') {
        if(pricePiece.props.value < productDetails.priceRegular.value) {
            finalPrice = isAddToCartDisabled ? <span>Starting at {pricePiece}</span> :
            (
                <div>
                    {pricePiece}
                    <span className={classes.priceDivider}></span>
                    <span className={classes.productOriginal}>
                        <Price currencyCode={productDetails.priceRegular.currency} value={productDetails.priceRegular.value} />
                    </span>
                </div>
            )
        }
    } else {
        if(pricePiece.props.value < product.price.regularPrice.amount.value) {
            finalPrice = (
                <div>
                    {pricePiece}
                    <span className={classes.priceDivider}></span>
                    <span className={classes.productOriginal}>
                        <Price currencyCode={product.price.regularPrice.amount.currency} value={product.price.regularPrice.amount.value} />
                    </span>
                </div>
            )
        }
    }

    let dealClubSpecialPrice = 0;
    
    if(product.deal_club_discount_percent_enable) {
        dealClubSpecialPrice = pricePiece.props.value - ((product.deal_club_discount_percentage / 100) * pricePiece.props.value);
        if(dealClubSpecialPrice < 0) {
            dealClubSpecialPrice = 0;
        }
    }
    
    const dealClubSpecialPriceHtml = product.deal_club_discount_percent_enable ?
        (
            <div className={classes.dealClubPriceWrapper}>
                <span className={classes.dealClubPriceTitle}>DealClub Price: </span>
                <span className={classes.dealClubPrice}>
                    <Price
                        currencyCode={productDetails.price.currency}
                        value={dealClubSpecialPrice}
                    />
                </span>
            </div>
        )
    : null;

    return (
        <div className={classes.productDetailsContainer}>
            <Form className={classes.mainContainer} onSubmit={handleAddToCart}>
                <section className={classes.leftSubContainer}>
                    <div className={classes.breadCrumbsWrapper}>
                        {breadcrumbs}
                    </div>
                    <div>
                        <h1 className={classes.productTitle}>
                            {productDetails.name}
                        </h1>
                        {productDetails.short_description !== '' && (
                            <div className={classes.productShortDescription}>
                                <RichContent html={productDetails.short_description.html} />
                            </div>
                        )}
                    </div>
                    <Carousel images={mediaGalleryEntries} />
                    <div className={classes.skuWrapper}>
                        <span className={classes.sku}>
                            <FormattedMessage
                                id={'global.sku'}
                                defaultMessage={'SKU'}
                            />
                        </span>
                        <span>: {productDetails.sku}</span>
                    </div>
                    <span className={classes.descriptionTitle}>
                        <FormattedMessage
                            id={'productFullDetail.productDescription'}
                            defaultMessage={'Product Description'}
                        />
                    </span>
                    <div className={classes.productDescription}>
                        <RichContent html={productDetails.description} />
                    </div>
                </section>
                <FormError
                    classes={{
                        root: classes.formErrors
                    }}
                    errors={errors.get('form') || []}
                />
                <section className={classes.rightSubContainer}>
                    <div className={classes.optionsContainer}>
                        {options}
                    </div>
                    <div className={classes.qtyWrapper}>
                        <span className={`${classes.quantityTitle} ${classes.qty_title}`}>
                            <FormattedMessage
                                id={'global.quantity'}
                                defaultMessage={'Quantity'}
                            />
                        </span>
                        <QuantityFields
                            classes={{ root: classes.quantityRoot }}
                            min={1}
                            message={errors.get('quantity')}
                        />
                    </div>
                    {cartActionContent}
                    <div className={classes.wrapperPrice}>
                        <span className={classes.productPrice}>
                           {finalPrice}
                        </span>
                        {isOutOfStock ? (
                            <span className="outOfStock">
                                <FormattedMessage
                                    id="productFullDetail.outOfStoc"
                                    defaultMessage="Out of stock"
                                />
                            </span>
                        ) : (
                            ''
                        )}
                    </div>
                    {dealClubSpecialPriceHtml}
                    {product.deal_timer_end_point && <div className={classes.dealtimer}>
                        {timerComponents.length ? timerComponents : ''}
                    </div>}
                    <Suspense fallback={null}>
                        <WishlistButton {...wishlistButtonProps} />
                    </Suspense>
                </section>
            </Form>
        </div>
    );
};

ProductFullDetail.propTypes = {
    classes: shape({
        cartActions: string,
        description: string,
        descriptionTitle: string,
        details: string,
        detailsTitle: string,
        imageCarousel: string,
        options: string,
        productName: string,
        productPrice: string,
        quantity: string,
        quantityTitle: string,
        root: string,
        title: string,
        unavailableContainer: string
    }),
    product: shape({
        __typename: string,
        id: number,
        stock_status: string,
        sku: string.isRequired,
        price: shape({
            regularPrice: shape({
                amount: shape({
                    currency: string.isRequired,
                    value: number.isRequired
                })
            }).isRequired
        }).isRequired,
        media_gallery_entries: arrayOf(
            shape({
                uid: string,
                label: string,
                position: number,
                disabled: bool,
                file: string.isRequired
            })
        ),
        description: string
    }).isRequired
};

export default ProductFullDetail;
