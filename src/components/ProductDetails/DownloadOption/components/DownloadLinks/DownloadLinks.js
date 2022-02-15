import React from 'react';

import { mergeClasses } from '@magento/venia-ui/lib/classify';
import defaultClasses from './DownloadLinks.module.css';

export const DownloadLinks = (props) => {
    const {product} = props
    const {downloadable_product_samples} = product
    const classes = mergeClasses(defaultClasses, props.classes);

    if (downloadable_product_samples && downloadable_product_samples.length > 0) {
        const returnedSamples = [...downloadable_product_samples]
            .sort((a, b) => a.sort_order < b.sort_order)
            .map((downloadSample, index) => {
                return (
                    <div className={classes.samplelink} key={index}>
                        <a key={index} href={downloadSample.sample_url} target="_blank"
                           className={classes.downloadsampleitem}>
                            {downloadSample.title}
                        </a>
                    </div>
                )
            })
        return (
            <div className={classes.downloadsamples}>
                <h4 className={classes.sampletitle}>Samples</h4>
                <div className={classes.sampleslist}>
                    {returnedSamples}
                </div>
            </div>
        )
    }
    return null
};
