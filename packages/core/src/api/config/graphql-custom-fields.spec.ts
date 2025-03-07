import { CustomFieldConfig, CustomFields } from '@vendure/common/lib/shared-types';
import { printSchema } from 'graphql';

import { addGraphQLCustomFields, addOrderLineCustomFieldsInput } from './graphql-custom-fields';

describe('addGraphQLCustomFields()', () => {
    it('uses JSON scalar if no custom fields defined', () => {
        const input = `
            type Product {
                id: ID
            }
        `;
        const customFieldConfig: CustomFields = {
            Product: [],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type', () => {
        const input = `
            type Product {
                id: ID
            }
        `;
        const customFieldConfig: CustomFields = {
            Product: [{ name: 'available', type: 'boolean' }],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type with a translation', () => {
        const input = `
                    type Product {
                        id: ID
                        translations: [ProductTranslation!]!
                    }

                    type ProductTranslation {
                        id: ID
                    }
                `;
        const customFieldConfig: CustomFields = {
            Product: [{ name: 'available', type: 'boolean' }, { name: 'shortName', type: 'localeString' }],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type with a Create input', () => {
        const input = `
                    type Product {
                        id: ID
                    }

                    input CreateProductInput {
                        image: String
                    }
                `;
        const customFieldConfig: CustomFields = {
            Product: [{ name: 'available', type: 'boolean' }, { name: 'shortName', type: 'localeString' }],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type with an Update input', () => {
        const input = `
                    type Product {
                        id: ID
                    }

                    input UpdateProductInput {
                        image: String
                    }
                `;
        const customFieldConfig: CustomFields = {
            Product: [{ name: 'available', type: 'boolean' }, { name: 'shortName', type: 'localeString' }],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type with a Create input and a translation', () => {
        const input = `
                    type Product {
                        id: ID
                    }

                    type ProductTranslation {
                        id: ID
                    }

                    input ProductTranslationInput {
                        id: ID
                    }

                    input CreateProductInput {
                        image: String
                    }
                `;
        const customFieldConfig: CustomFields = {
            Product: [{ name: 'available', type: 'boolean' }, { name: 'shortName', type: 'localeString' }],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type with SortParameters', () => {
        const input = `
                    type Product {
                        id: ID
                    }

                    input ProductSortParameter {
                        id: SortOrder
                    }

                    enum SortOrder {
                        ASC
                        DESC
                    }
                `;
        const customFieldConfig: CustomFields = {
            Product: [{ name: 'available', type: 'boolean' }, { name: 'shortName', type: 'localeString' }],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('extends a type with FilterParameters', () => {
        const input = `
                    type Product {
                        name: String
                    }

                    input ProductFilterParameter {
                        id: StringOperators
                    }

                    input StringOperators {
                        eq: String
                    }

                    input NumberOperators {
                        eq: Float
                    }

                    input DateOperators {
                        eq: String
                    }

                    input BooleanOperators {
                        eq: Boolean
                    }

                `;
        const customFieldConfig: CustomFields = {
            Product: [
                { name: 'available', type: 'boolean' },
                { name: 'shortName', type: 'localeString' },
                { name: 'rating', type: 'float' },
                { name: 'published', type: 'datetime' },
            ],
        };
        const result = addGraphQLCustomFields(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });
});

describe('addOrderLineCustomFieldsInput()', () => {

    it('Modifies the schema when the addItemToOrder & adjustOrderLine mutation is present', () => {
        const input = `
            type Mutation {
                addItemToOrder(id: ID!, quantity: Int!): Boolean
                adjustOrderLine(id: ID!, quantity: Int): Boolean
            }
        `;
        const customFieldConfig: CustomFieldConfig[] = [
            { name: 'giftWrap', type: 'boolean' },
            { name: 'message', type: 'string' },
        ];
        const result = addOrderLineCustomFieldsInput(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });

    it('Does not modify schema when the addItemToOrder mutation not present', () => {
        const input = `
            type Mutation {
                createCustomer(id: ID!): Boolean
            }
        `;
        const customFieldConfig: CustomFieldConfig[] = [
            { name: 'giftWrap', type: 'boolean' },
            { name: 'message', type: 'string' },
        ];
        const result = addOrderLineCustomFieldsInput(input, customFieldConfig);
        expect(printSchema(result)).toMatchSnapshot();
    });
});
