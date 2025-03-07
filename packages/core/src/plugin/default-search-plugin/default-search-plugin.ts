import { Provider } from '@nestjs/common';
import { SearchReindexResponse } from '@vendure/common/lib/generated-types';
import { CREATING_VENDURE_APP } from '@vendure/common/lib/shared-constants';
import { Type } from '@vendure/common/lib/shared-types';
import gql from 'graphql-tag';

import { idsAreEqual } from '../../common/utils';
import { APIExtensionDefinition, VendurePlugin } from '../../config';
import { ProductVariant } from '../../entity/product-variant/product-variant.entity';
import { Product } from '../../entity/product/product.entity';
import { EventBus } from '../../event-bus/event-bus';
import { CatalogModificationEvent } from '../../event-bus/events/catalog-modification-event';
import { CollectionModificationEvent } from '../../event-bus/events/collection-modification-event';
import { TaxRateModificationEvent } from '../../event-bus/events/tax-rate-modification-event';
import { SearchService } from '../../service/services/search.service';

import { AdminFulltextSearchResolver, ShopFulltextSearchResolver } from './fulltext-search.resolver';
import { FulltextSearchService } from './fulltext-search.service';
import { IndexerController } from './indexer/indexer.controller';
import { SearchIndexService } from './indexer/search-index.service';
import { SearchIndexItem } from './search-index-item.entity';

export interface DefaultSearchReindexResponse extends SearchReindexResponse {
    timeTaken: number;
    indexedItemCount: number;
}

/**
 * @description
 * The DefaultSearchPlugin provides a full-text Product search based on the full-text searching capabilities of the
 * underlying database.
 *
 * The DefaultSearchPlugin is bundled with the `\@vendure/core` package. If you are not using an alternative search
 * plugin, then make sure this one is used, otherwise you will not be able to search products via the
 * [`search` query](/docs/graphql-api/shop/queries#search).
 *
 * {{% alert "warning" %}}
 * Note that the quality of the fulltext search capabilities varies depending on the underlying database being used. For example,
 * the MySQL & Postgres implementations will typically yield better results than the SQLite implementation.
 * {{% /alert %}}
 *
 *
 * @example
 * ```ts
 * import { DefaultSearchPlugin } from '\@vendure/core';
 *
 * const config: VendureConfig = {
 *   // Add an instance of the plugin to the plugins array
 *   plugins: [
 *     new DefaultSearchPlugin(),
 *   ],
 * };
 * ```
 *
 * @docsCategory DefaultSearchPlugin
 */
export class DefaultSearchPlugin implements VendurePlugin {

    /** @internal */
    async onBootstrap(inject: <T>(type: Type<T>) => T): Promise<void> {
        const eventBus = inject(EventBus);
        const searchIndexService = inject(SearchIndexService);
        eventBus.subscribe(CatalogModificationEvent, event => {
            if (event.entity instanceof Product || event.entity instanceof ProductVariant) {
                return searchIndexService.updateProductOrVariant(event.ctx, event.entity).start();
            }
        });
        eventBus.subscribe(CollectionModificationEvent, event => {
            return searchIndexService.updateVariantsById(event.ctx, event.productVariantIds).start();
        });
        eventBus.subscribe(TaxRateModificationEvent, event => {
            const defaultTaxZone = event.ctx.channel.defaultTaxZone;
            if (defaultTaxZone && idsAreEqual(defaultTaxZone.id, event.taxRate.zone.id)) {
                return searchIndexService.reindex(event.ctx).start();
            }
        });
    }

    /** @internal */
    extendAdminAPI(): APIExtensionDefinition {
        return {
            resolvers: [AdminFulltextSearchResolver],
            schema: gql`
                extend type SearchReindexResponse {
                    timeTaken: Int!
                    indexedItemCount: Int!
                }
            `,
        };
    }

    /** @internal */
    extendShopAPI(): APIExtensionDefinition {
        return {
            resolvers: [ShopFulltextSearchResolver],
            schema: gql`
                extend type SearchReindexResponse {
                    timeTaken: Int!
                    indexedItemCount: Int!
                }
            `,
        };
    }

    /** @internal */
    defineEntities(): Array<Type<any>> {
        return [SearchIndexItem];
    }

    /** @internal */
    defineProviders(): Provider[] {
        return [
            FulltextSearchService,
            SearchIndexService,
            { provide: SearchService, useClass: FulltextSearchService },
        ];
    }

    /** @internal */
    defineWorkers(): Array<Type<any>> {
        return [
            IndexerController,
        ];
    }
}
