import React from "react";
import { FormattedMessage } from 'react-intl';
import { MY_DOWNLOADABLE_PRODUCTS } from "./myDownloads.gql";
import { fullPageLoadingIndicator } from "@magento/venia-ui/lib/components/LoadingIndicator";
import { useQuery } from "@apollo/client";
import ErrorView from "@magento/venia-ui/lib/components/ErrorView";
import { mergeClasses } from '@magento/venia-ui/lib/classify';
import defaultClasses from './MyDownloadsStyles.module.css';
import FileSaver from 'file-saver';
import saveAs from 'file-saver';
import axios from 'axios';
import { useOrderHistoryPage } from '@magento/peregrine/lib/talons/OrderHistoryPage/useOrderHistoryPage';

const MyDownloads = props => {

    const talonProps = useOrderHistoryPage();
    const {
        orders,
    } = talonProps;

    const classes = mergeClasses(defaultClasses, props.classes);

    const { loading, error, data } = useQuery(MY_DOWNLOADABLE_PRODUCTS, {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first'
    });

    if (!data) {
        if (loading) {
            return fullPageLoadingIndicator;
        }
        if (error) {
            return <ErrorView message={error.message} />;
        }
    }

    const test = (url_link) => {
        console.log(url_link)
        axios({
            url: url_link,
            method: 'GET',
            responseType: 'blob', // important
        }).then((response) => {
            saveAs(response.data, 'Download');
        });
    };
    
    let myDownloadableProductsHtml = data.customerDownloadableProducts.items.map(function(element, index) {
        let html;
        orders.forEach(order => {
            if (order.number === element.order_increment_id ) {
                html = <tr className={classes.downloadstablerows} key={index}>
                    <td className={classes.downloadstabledata}>{element.order_increment_id}</td>
                    <td className={classes.downloadstabledata}>{element.date}</td>
                    <td className={classes.downloadstabledata}>{order.items[0].product_name}</td>
                    <td className={classes.downloadstabledata}><button className={classes.downloadurl} onClick={() => test(element.download_url)}>Download</button></td>
                    <td className={classes.downloadstabledata}>{element.remaining_downloads}</td>
                </tr>;
            }
        });
        return html;
    });

    return (
        <div>
            <div className={classes.downloadstitlewrapper}>
                <h1 className={classes.mydownloadstitle}>My Downloads</h1>
            </div>
            <div className={classes.downloadtableparent}>
                <table className={classes.downloadstable}>
                    <thead>
                        <tr className={classes.downloadstablerows}>
                            <th className={classes.downloadstableheadings}>Order</th>
                            <th className={classes.downloadstableheadings}>Date</th>
                            <th className={classes.downloadstableheadings}>Product Name</th>
                            <th className={classes.downloadstableheadings}>Download URL</th>
                            <th className={classes.downloadstableheadings}>Remaining Downloads</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myDownloadableProductsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default MyDownloads;