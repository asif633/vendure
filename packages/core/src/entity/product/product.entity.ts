import { DeepPartial, HasCustomFields } from '@vendure/common/lib/shared-types';
import { doc } from 'prettier';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { ChannelAware, SoftDeletable } from '../../common/types/common-types';
import { LocaleString, Translatable, Translation } from '../../common/types/locale-types';
import { Asset } from '../asset/asset.entity';
import { VendureEntity } from '../base/base.entity';
import { Channel } from '../channel/channel.entity';
import { CustomProductFields } from '../custom-entity-fields';
import { FacetValue } from '../facet-value/facet-value.entity';
import { ProductOptionGroup } from '../product-option-group/product-option-group.entity';
import { ProductVariant } from '../product-variant/product-variant.entity';

import { ProductTranslation } from './product-translation.entity';

/**
 * @description
 * A Product contains one or more {@link ProductVariant}s and serves as a container for those variants,
 * providing an overall name, description etc.
 *
 * @docsCategory entities
 */
@Entity()
export class Product extends VendureEntity
    implements Translatable, HasCustomFields, ChannelAware, SoftDeletable {
    constructor(input?: DeepPartial<Product>) {
        super(input);
    }

    @Column({ type: Date, nullable: true, default: null })
    deletedAt: Date | null;

    name: LocaleString;

    slug: LocaleString;

    description: LocaleString;

    @Column({ default: true })
    enabled: boolean;

    @ManyToOne(type => Asset)
    featuredAsset: Asset;

    @ManyToMany(type => Asset)
    @JoinTable()
    assets: Asset[];

    @OneToMany(type => ProductTranslation, translation => translation.base, { eager: true })
    translations: Array<Translation<Product>>;

    @OneToMany(type => ProductVariant, variant => variant.product)
    variants: ProductVariant[];

    @OneToMany(type => ProductOptionGroup, optionGroup => optionGroup.product)
    optionGroups: ProductOptionGroup[];

    @ManyToMany(type => FacetValue)
    @JoinTable()
    facetValues: FacetValue[];

    @Column(type => CustomProductFields)
    customFields: CustomProductFields;

    @ManyToMany(type => Channel)
    @JoinTable()
    channels: Channel[];
}
