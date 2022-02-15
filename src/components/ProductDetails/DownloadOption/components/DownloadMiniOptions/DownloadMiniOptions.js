import React from 'react';
import {isDownloadableLinkRequired} from "../../utils/isDownloadableLinkRequired";
import {MiniOption} from "./MiniOption";
import {RequiredLabel} from "../../../Ui/components/RequiredLabel/RequiredLabel";

import { mergeClasses } from '@magento/venia-ui/lib/classify';
import defaultClasses from './DownloadMiniOptions.module.css';

export const DownloadMiniOptions = (props) => {
    const {product} = props
    const isLinkRequired = isDownloadableLinkRequired(product)
    const {downloadable_product_links} = product
    const classes = mergeClasses(defaultClasses, props.classes);

    const optionSelect = (() => {
        if (downloadable_product_links) {
            const {downloadable_product_links, links_purchased_separately, links_title} = product;

            const objOptions = [];
            for (const i in downloadable_product_links) {
                const attribute = downloadable_product_links[i];
                if (links_purchased_separately) {
                    // this.required.push(attribute.id)
                }
                objOptions.push(<MiniOption key={i} {...props} item={attribute}/>);
            }
            const required = isLinkRequired ? <RequiredLabel/> : '';

            return (
                <div className={classes.optionselect}>
                    {links_title && <div className={classes.optiontitle}>
                        <span>{links_title}{required}</span>
                    </div>}
                    <div className={classes.checkboxlist}>
                        {objOptions}
                    </div>
                </div>
            )
        }
        return null
    })();


    return (
        <div id="downloadableOption">
            {optionSelect}
        </div>
    );
};
