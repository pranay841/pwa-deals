import { gql } from '@apollo/client';
export const MY_DOWNLOADABLE_PRODUCTS = gql`
    query { 
        customerDownloadableProducts {
            items {
                date
                download_url
                order_increment_id
                remaining_downloads
                status
            }
        }
    }
`;