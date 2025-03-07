import { CurrencyCode } from '@vendure/common/lib/generated-types';
import { DeepPartial, HasCustomFields } from '@vendure/common/lib/shared-types';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { SoftDeletable } from '../../common/types/common-types';
import { LocaleString, Translatable, Translation } from '../../common/types/locale-types';
import { Asset } from '../asset/asset.entity';
import { VendureEntity } from '../base/base.entity';
import { Collection } from '../collection/collection.entity';
import { CustomProductVariantFields } from '../custom-entity-fields';
import { FacetValue } from '../facet-value/facet-value.entity';
import { ProductOption } from '../product-option/product-option.entity';
import { Product } from '../product/product.entity';
import { StockMovement } from '../stock-movement/stock-movement.entity';
import { TaxCategory } from '../tax-category/tax-category.entity';
import { TaxRate } from '../tax-rate/tax-rate.entity';

import { ProductVariantPrice } from './product-variant-price.entity';
import { ProductVariantTranslation } from './product-variant-translation.entity';

/**
 * @description
 * A ProductVariant represents a single stock keeping unit (SKU) in the store's inventory.
 * Whereas a {@link Product} is a "container" of variants, the variant itself holds the
 * data on price, tax category etc. When one adds items to their cart, they are adding
 * ProductVariants, not Products.
 *
 * @docsCategory entities
 */
@Entity()
export class ProductVariant extends VendureEntity implements Translatable, HasCustomFields, SoftDeletable {
    constructor(input?: DeepPartial<ProductVariant>) {
        super(input);
    }

    @Column({ type: Date, nullable: true, default: null })
    deletedAt: Date | null;

    name: LocaleString;

    @Column({ default: true })
    enabled: boolean;

    @Column()
    sku: string;

    /**
     * A synthetic property which is populated with data from a ProductVariantPrice entity.
     * It is marked as a @Column() so that changes to it will trigger the afterUpdate subscriber.
     */
    @Column({
        name: 'lastPriceValue',
        comment: 'Not used - actual price is stored in product_variant_price table',
    })
    price: number;

    /**
     * Calculated at run-time
     */
    currencyCode: CurrencyCode;

    /**
     * Calculated at run-time
     */
    priceIncludesTax: boolean;

    /**
     * Calculated at run-time
     */
    priceWithTax: number;

    /**
     * Calculated at run-time
     */
    taxRateApplied: TaxRate;

    @ManyToOne(type => Asset)
    featuredAsset: Asset;

    @ManyToMany(type => Asset)
    @JoinTable()
    assets: Asset[];

    @ManyToOne(type => TaxCategory)
    taxCategory: TaxCategory;

    @OneToMany(type => ProductVariantPrice, price => price.variant, { eager: true })
    productVariantPrices: ProductVariantPrice[];

    @OneToMany(type => ProductVariantTranslation, translation => translation.base, { eager: true })
    translations: Array<Translation<ProductVariant>>;

    @ManyToOne(type => Product, product => product.variants)
    product: Product;

    @Column({ nullable: true })
    productId: number;

    @Column({ default: 0 })
    stockOnHand: number;

    @Column()
    trackInventory: boolean;

    @OneToMany(type => StockMovement, stockMovement => stockMovement.productVariant)
    stockMovements: StockMovement[];

    @ManyToMany(type => ProductOption)
    @JoinTable()
    options: ProductOption[];

    @ManyToMany(type => FacetValue)
    @JoinTable()
    facetValues: FacetValue[];

    @Column(type => CustomProductVariantFields)
    customFields: CustomProductVariantFields;

    @ManyToMany(type => Collection, collection => collection.productVariants)
    collections: Collection[];
}
