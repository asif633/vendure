import gql from 'graphql-tag';

import { ASSET_FRAGMENT } from './product-definitions';
import { CONFIGURABLE_FRAGMENT } from './promotion-definitions';

export const GET_COLLECTION_FILTERS = gql`
    query GetCollectionFilters {
        collectionFilters {
            ...ConfigurableOperation
        }
    }
    ${CONFIGURABLE_FRAGMENT}
`;

export const COLLECTION_FRAGMENT = gql`
    fragment Collection on Collection {
        id
        name
        description
        isPrivate
        languageCode
        featuredAsset {
            ...Asset
        }
        assets {
            ...Asset
        }
        filters {
            ...ConfigurableOperation
        }
        translations {
            id
            languageCode
            name
            description
        }
        parent {
            id
            name
        }
        children {
            id
            name
        }
    }
    ${ASSET_FRAGMENT}
    ${CONFIGURABLE_FRAGMENT}
`;

export const GET_COLLECTION_LIST = gql`
    query GetCollectionList($options: CollectionListOptions, $languageCode: LanguageCode) {
        collections(languageCode: $languageCode, options: $options) {
            items {
                id
                name
                description
                isPrivate
                featuredAsset {
                    ...Asset
                }
                parent {
                    id
                }
            }
            totalItems
        }
    }
    ${ASSET_FRAGMENT}
`;

export const GET_COLLECTION = gql`
    query GetCollection($id: ID!, $languageCode: LanguageCode) {
        collection(id: $id, languageCode: $languageCode) {
            ...Collection
        }
    }
    ${COLLECTION_FRAGMENT}
`;

export const CREATE_COLLECTION = gql`
    mutation CreateCollection($input: CreateCollectionInput!) {
        createCollection(input: $input) {
            ...Collection
        }
    }
    ${COLLECTION_FRAGMENT}
`;

export const UPDATE_COLLECTION = gql`
    mutation UpdateCollection($input: UpdateCollectionInput!) {
        updateCollection(input: $input) {
            ...Collection
        }
    }
    ${COLLECTION_FRAGMENT}
`;

export const MOVE_COLLECTION = gql`
    mutation MoveCollection($input: MoveCollectionInput!) {
        moveCollection(input: $input) {
            ...Collection
        }
    }
    ${COLLECTION_FRAGMENT}
`;

export const DELETE_COLLECTION = gql`
    mutation DeleteCollection($id: ID!) {
        deleteCollection(id: $id) {
            result
            message
        }
    }
`;

export const GET_COLLECTION_CONTENTS = gql`
    query GetCollectionContents($id: ID!, $options: ProductVariantListOptions) {
        collection(id: $id) {
            id
            name
            productVariants(options: $options) {
                items {
                    id
                    productId
                    name
                }
                totalItems
            }
        }
    }
`;
