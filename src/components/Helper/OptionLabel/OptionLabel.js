import React from 'react';
import PropTypes from 'prop-types';
import CurrencySymbol from '@magento/venia-ui/lib/components/CurrencySymbol/currencySymbol.js'

const Optionlabel = props => {
    const {classes, title, item, type_id, raw = false, extraPrice} = props;
    let style = props.style ? props.style : {};
    let returnedLabel = title ? title : '';
    style = {
        ...{
            display: 'inline-block',
            fontWeight: '400'
        },
        ...style
    };
    const priceStyle = {
        color: '#333',
        fontSize: 13,
        fontWeight: 200
    };
    const symbol = <span style={{margin: '0 5px 0 10px'}}>+</span>;

    const renderOnePrice = price => {
        return (
            <div style={style} className={classes.labeloptiontext}>
                <span
                    style={{
                        fontSize: '16px'
                    }}
                >
                    {title}
                </span>
                <span
                    className={classes.labeloptionprice}
                    style={priceStyle}
                >
                    {symbol}
                    <CurrencySymbol currencyCode={extraPrice.currency} /> {price}
                </span>
            </div>
        );
    };

    if (
        type_id === 'simple' ||
        type_id === 'configurable' ||
        type_id === 'virtual'
    ) {
       if (item.price) {
            returnedLabel = renderOnePrice(item.price);
        }
    } else if (type_id === 'downloadable') {
        if (item.price) {
            returnedLabel = renderOnePrice(item.price);
        }
    }
    if (raw) {
        return returnedLabel;
    }

    return (
        <div style={style} className={classes.labeloptiontext}>
            <span
                style={{
                    fontSize: '16px'
                }}
            >
                {returnedLabel}
            </span>
        </div>
    );
};

Optionlabel.propTypes = {
    item: PropTypes.object.isRequired,
    classes: PropTypes.object,
    type_id: PropTypes.string,
    style: PropTypes.object,
    label: PropTypes.string
};

Optionlabel.defaultProps = {
    style: {},
    classes: {},
    type_id: 'simple'
};

export default Optionlabel;
