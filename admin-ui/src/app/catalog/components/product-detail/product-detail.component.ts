import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, EMPTY, merge, Observable } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { normalizeString } from 'shared/normalize-string';
import { CustomFieldConfig } from 'shared/shared-types';
import { notNullOrUndefined } from 'shared/shared-utils';
import { unique } from 'shared/unique';
import { IGNORE_CAN_DEACTIVATE_GUARD } from 'src/app/shared/providers/routing/can-deactivate-detail-guard';

import { BaseDetailComponent } from '../../../common/base-detail.component';
import {
    CreateProductInput,
    FacetWithValues,
    LanguageCode,
    ProductWithVariants,
    TaxCategory,
    UpdateProductInput,
    UpdateProductMutation,
    UpdateProductOptionInput,
    UpdateProductVariantInput,
    UpdateProductVariantsMutation,
} from '../../../common/generated-types';
import { createUpdatedTranslatable } from '../../../common/utilities/create-updated-translatable';
import { flattenFacetValues } from '../../../common/utilities/flatten-facet-values';
import { _ } from '../../../core/providers/i18n/mark-for-extraction';
import { NotificationService } from '../../../core/providers/notification/notification.service';
import { ServerConfigService } from '../../../data/server-config';
import { ModalService } from '../../../shared/providers/modal/modal.service';
import { ProductDetailService } from '../../providers/product-detail.service';
import { ApplyFacetDialogComponent } from '../apply-facet-dialog/apply-facet-dialog.component';
import { CreateProductVariantsConfig } from '../generate-product-variants/generate-product-variants.component';
import { VariantAssetChange } from '../product-variants-list/product-variants-list.component';

export type TabName = 'details' | 'variants';
export interface VariantFormValue {
    enabled: boolean;
    sku: string;
    name: string;
    price: number;
    priceIncludesTax: boolean;
    priceWithTax: number;
    taxCategoryId: string;
    stockOnHand: number;
    trackInventory: boolean;
    facetValueIds: string[];
}

export interface SelectedAssets {
    assetIds?: string[];
    featuredAssetId?: string;
}

@Component({
    selector: 'vdr-product-detail',
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent extends BaseDetailComponent<ProductWithVariants.Fragment>
    implements OnInit, OnDestroy {
    activeTab$: Observable<TabName>;
    product$: Observable<ProductWithVariants.Fragment>;
    variants$: Observable<ProductWithVariants.Variants[]>;
    taxCategories$: Observable<TaxCategory.Fragment[]>;
    customFields: CustomFieldConfig[];
    customVariantFields: CustomFieldConfig[];
    detailForm: FormGroup;
    assetChanges: SelectedAssets = {};
    variantAssetChanges: { [variantId: string]: SelectedAssets } = {};
    facetValues$: Observable<ProductWithVariants.FacetValues[]>;
    facets$: Observable<FacetWithValues.Fragment[]>;
    selectedVariantIds: string[] = [];
    variantDisplayMode: 'card' | 'table' = 'card';
    createVariantsConfig: CreateProductVariantsConfig = { groups: [], variants: [] };

    constructor(
        route: ActivatedRoute,
        router: Router,
        serverConfigService: ServerConfigService,
        private productDetailService: ProductDetailService,
        private formBuilder: FormBuilder,
        private modalService: ModalService,
        private notificationService: NotificationService,
        private location: Location,
        private changeDetector: ChangeDetectorRef,
    ) {
        super(route, router, serverConfigService);
        this.customFields = this.getCustomFieldConfig('Product');
        this.customVariantFields = this.getCustomFieldConfig('ProductVariant');
        this.detailForm = this.formBuilder.group({
            product: this.formBuilder.group({
                enabled: true,
                name: ['', Validators.required],
                slug: '',
                description: '',
                facetValueIds: [[]],
                customFields: this.formBuilder.group(
                    this.customFields.reduce((hash, field) => ({ ...hash, [field.name]: '' }), {}),
                ),
            }),
            variants: this.formBuilder.array([]),
        });
    }

    ngOnInit() {
        this.init();
        this.product$ = this.entity$;
        this.variants$ = this.product$.pipe(map(product => product.variants));
        this.taxCategories$ = this.productDetailService.getTaxCategories();
        this.activeTab$ = this.route.paramMap.pipe(map(qpm => qpm.get('tab') as any));

        // FacetValues are provided initially by the nested array of the
        // Product entity, but once a fetch to get all Facets is made (as when
        // opening the FacetValue selector modal), then these additional values
        // are concatenated onto the initial array.
        this.facets$ = this.productDetailService.getFacets();
        const productFacetValues$ = this.product$.pipe(map(product => product.facetValues));
        const allFacetValues$ = this.facets$.pipe(map(flattenFacetValues));
        const productGroup = this.getProductFormGroup();

        const formFacetValueIdChanges$ = productGroup.valueChanges.pipe(
            map(val => val.facetValueIds as string[]),
            distinctUntilChanged(),
        );
        const formChangeFacetValues$ = combineLatest(
            formFacetValueIdChanges$,
            productFacetValues$,
            allFacetValues$,
        ).pipe(
            map(([ids, productFacetValues, allFacetValues]) => {
                const combined = [...productFacetValues, ...allFacetValues];
                return ids.map(id => combined.find(fv => fv.id === id)).filter(notNullOrUndefined);
            }),
        );

        this.facetValues$ = merge(productFacetValues$, formChangeFacetValues$);
    }

    ngOnDestroy() {
        this.destroy();
    }

    navigateToTab(tabName: TabName) {
        this.router.navigate(['./', { tab: tabName }], {
            relativeTo: this.route,
            state: {
                [IGNORE_CAN_DEACTIVATE_GUARD]: true,
            },
        });
    }

    customFieldIsSet(name: string): boolean {
        return !!this.detailForm.get(['product', 'customFields', name]);
    }

    assetsChanged(): boolean {
        return !!Object.values(this.assetChanges).length;
    }

    variantAssetsChanged(): boolean {
        return !!Object.keys(this.variantAssetChanges).length;
    }

    variantAssetChange(event: VariantAssetChange) {
        this.variantAssetChanges[event.variantId] = event;
    }

    /**
     * If creating a new product, automatically generate the slug based on the product name.
     */
    updateSlug(nameValue: string) {
        this.isNew$.pipe(take(1)).subscribe(isNew => {
            if (isNew) {
                const slugControl = this.detailForm.get(['product', 'slug']);
                if (slugControl && slugControl.pristine) {
                    slugControl.setValue(normalizeString(`${nameValue}`, '-'));
                }
            }
        });
    }

    selectProductFacetValue() {
        this.displayFacetValueModal().subscribe(facetValueIds => {
            if (facetValueIds) {
                const productGroup = this.getProductFormGroup();
                const currentFacetValueIds = productGroup.value.facetValueIds;
                productGroup.patchValue({
                    facetValueIds: unique([...currentFacetValueIds, ...facetValueIds]),
                });
                productGroup.markAsDirty();
            }
        });
    }

    updateProductOption(input: UpdateProductOptionInput) {
        this.productDetailService.updateProductOption(input).subscribe(
            () => {
                this.notificationService.success(_('common.notify-update-success'), {
                    entity: 'ProductOption',
                });
            },
            err => {
                this.notificationService.error(_('common.notify-update-error'), {
                    entity: 'ProductOption',
                });
            },
        );
    }

    removeProductFacetValue(facetValueId: string) {
        const productGroup = this.getProductFormGroup();
        const currentFacetValueIds = productGroup.value.facetValueIds;
        productGroup.patchValue({
            facetValueIds: currentFacetValueIds.filter(id => id !== facetValueId),
        });
        productGroup.markAsDirty();
    }

    /**
     * Opens a dialog to select FacetValues to apply to the select ProductVariants.
     */
    selectVariantFacetValue(selectedVariantIds: string[]) {
        this.displayFacetValueModal()
            .pipe(withLatestFrom(this.variants$))
            .subscribe(([facetValueIds, variants]) => {
                if (facetValueIds) {
                    for (const variantId of selectedVariantIds) {
                        const index = variants.findIndex(v => v.id === variantId);
                        const variant = variants[index];
                        const existingFacetValueIds = variant ? variant.facetValues.map(fv => fv.id) : [];
                        const variantFormGroup = this.detailForm.get(['variants', index]);
                        if (variantFormGroup) {
                            variantFormGroup.patchValue({
                                facetValueIds: unique([...existingFacetValueIds, ...facetValueIds]),
                            });
                            variantFormGroup.markAsDirty();
                        }
                    }
                    this.changeDetector.markForCheck();
                }
            });
    }

    variantsToCreateAreValid(): boolean {
        return (
            0 < this.createVariantsConfig.variants.length &&
            this.createVariantsConfig.variants.every(v => {
                return v.sku !== '';
            })
        );
    }

    deleteVariant(id: string) {
        this.modalService
            .dialog({
                title: _('catalog.confirm-delete-product-variant'),
                buttons: [
                    { type: 'seconday', label: _('common.cancel') },
                    { type: 'danger', label: _('common.delete'), returnValue: true },
                ],
            })
            .pipe(
                switchMap(response =>
                    response ? this.productDetailService.deleteProductVariant(id, this.id) : EMPTY,
                ),
            )
            .subscribe(
                () => {
                    this.notificationService.success(_('common.notify-delete-success'), {
                        entity: 'ProductVariant',
                    });
                },
                err => {
                    this.notificationService.error(_('common.notify-delete-error'), {
                        entity: 'ProductVariant',
                    });
                },
            );
    }

    private displayFacetValueModal(): Observable<string[] | undefined> {
        return this.productDetailService.getFacets().pipe(
            mergeMap(facets =>
                this.modalService.fromComponent(ApplyFacetDialogComponent, {
                    size: 'md',
                    locals: { facets },
                }),
            ),
            map(facetValues => facetValues && facetValues.map(v => v.id)),
        );
    }

    create() {
        const productGroup = this.getProductFormGroup();
        if (!productGroup.dirty) {
            return;
        }
        combineLatest(this.product$, this.languageCode$)
            .pipe(
                take(1),
                mergeMap(([product, languageCode]) => {
                    const newProduct = this.getUpdatedProduct(
                        product,
                        productGroup as FormGroup,
                        languageCode,
                    ) as CreateProductInput;
                    return this.productDetailService.createProduct(
                        newProduct,
                        this.createVariantsConfig,
                        languageCode,
                    );
                }),
            )
            .subscribe(
                ({ createProductVariants, productId }) => {
                    this.notificationService.success(_('common.notify-create-success'), {
                        entity: 'Product',
                    });
                    this.assetChanges = {};
                    this.variantAssetChanges = {};
                    this.detailForm.markAsPristine();
                    this.router.navigate(['../', productId], { relativeTo: this.route });
                },
                err => {
                    // tslint:disable-next-line:no-console
                    console.error(err);
                    this.notificationService.error(_('common.notify-create-error'), {
                        entity: 'Product',
                    });
                },
            );
    }

    save() {
        combineLatest(this.product$, this.languageCode$)
            .pipe(
                take(1),
                mergeMap(([product, languageCode]) => {
                    const productGroup = this.getProductFormGroup();
                    let productInput: UpdateProductInput | undefined;
                    let variantsInput: UpdateProductVariantInput[] | undefined;

                    if (productGroup.dirty || this.assetsChanged()) {
                        productInput = this.getUpdatedProduct(
                            product,
                            productGroup as FormGroup,
                            languageCode,
                        ) as UpdateProductInput;
                    }
                    const variantsArray = this.detailForm.get('variants');
                    if ((variantsArray && variantsArray.dirty) || this.variantAssetsChanged()) {
                        variantsInput = this.getUpdatedProductVariants(
                            product,
                            variantsArray as FormArray,
                            languageCode,
                        );
                    }

                    return this.productDetailService.updateProduct(productInput, variantsInput);
                }),
            )
            .subscribe(
                result => {
                    this.updateSlugAfterSave(result);
                    this.detailForm.markAsPristine();
                    this.assetChanges = {};
                    this.variantAssetChanges = {};
                    this.notificationService.success(_('common.notify-update-success'), {
                        entity: 'Product',
                    });
                    this.changeDetector.markForCheck();
                },
                err => {
                    this.notificationService.error(_('common.notify-update-error'), {
                        entity: 'Product',
                    });
                },
            );
    }

    /**
     * Sets the values of the form on changes to the product or current language.
     */
    protected setFormValues(product: ProductWithVariants.Fragment, languageCode: LanguageCode) {
        const currentTranslation = product.translations.find(t => t.languageCode === languageCode);
        this.detailForm.patchValue({
            product: {
                enabled: product.enabled,
                name: currentTranslation ? currentTranslation.name : '',
                slug: currentTranslation ? currentTranslation.slug : '',
                description: currentTranslation ? currentTranslation.description : '',
                facetValueIds: product.facetValues.map(fv => fv.id),
            },
        });

        if (this.customFields.length) {
            const customFieldsGroup = this.detailForm.get(['product', 'customFields']) as FormGroup;

            for (const fieldDef of this.customFields) {
                const key = fieldDef.name;
                const value =
                    fieldDef.type === 'localeString'
                        ? (currentTranslation as any).customFields[key]
                        : (product as any).customFields[key];
                const control = customFieldsGroup.get(key);
                if (control) {
                    control.patchValue(value);
                }
            }
        }

        const variantsFormArray = this.detailForm.get('variants') as FormArray;
        product.variants.forEach((variant, i) => {
            const variantTranslation = variant.translations.find(t => t.languageCode === languageCode);
            const facetValueIds = variant.facetValues.map(fv => fv.id);
            const group: VariantFormValue = {
                enabled: variant.enabled,
                sku: variant.sku,
                name: variantTranslation ? variantTranslation.name : '',
                price: variant.price,
                priceIncludesTax: variant.priceIncludesTax,
                priceWithTax: variant.priceWithTax,
                taxCategoryId: variant.taxCategory.id,
                stockOnHand: variant.stockOnHand,
                trackInventory: variant.trackInventory,
                facetValueIds,
            };

            const existing = variantsFormArray.at(i);
            if (existing) {
                existing.setValue(group);
            } else {
                variantsFormArray.insert(
                    i,
                    this.formBuilder.group({
                        ...group,
                        facetValueIds: this.formBuilder.control(facetValueIds),
                    }),
                );
            }
        });
    }

    /**
     * Given a product and the value of the detailForm, this method creates an updated copy of the product which
     * can then be persisted to the API.
     */
    private getUpdatedProduct(
        product: ProductWithVariants.Fragment,
        productFormGroup: FormGroup,
        languageCode: LanguageCode,
    ): UpdateProductInput | CreateProductInput {
        const updatedProduct = createUpdatedTranslatable({
            translatable: product,
            updatedFields: productFormGroup.value,
            customFieldConfig: this.customFields,
            languageCode,
            defaultTranslation: {
                languageCode,
                name: product.name || '',
                slug: product.slug || '',
                description: product.description || '',
            },
        });
        return {
            ...updatedProduct,
            ...this.assetChanges,
            facetValueIds: productFormGroup.value.facetValueIds,
        } as UpdateProductInput | CreateProductInput;
    }

    /**
     * Given an array of product variants and the values from the detailForm, this method creates an new array
     * which can be persisted to the API.
     */
    private getUpdatedProductVariants(
        product: ProductWithVariants.Fragment,
        variantsFormArray: FormArray,
        languageCode: LanguageCode,
    ): UpdateProductVariantInput[] {
        const dirtyVariants = product.variants.filter((v, i) => {
            const formRow = variantsFormArray.get(i.toString());
            return formRow && formRow.dirty;
        });
        const dirtyVariantValues = variantsFormArray.controls.filter(c => c.dirty).map(c => c.value);

        if (dirtyVariants.length !== dirtyVariantValues.length) {
            throw new Error(_(`error.product-variant-form-values-do-not-match`));
        }
        return dirtyVariants
            .map((variant, i) => {
                const formValue: VariantFormValue = dirtyVariantValues[i];
                const result: UpdateProductVariantInput = createUpdatedTranslatable({
                    translatable: variant,
                    updatedFields: formValue,
                    customFieldConfig: this.customVariantFields,
                    languageCode,
                    defaultTranslation: {
                        languageCode,
                        name: '',
                    },
                });
                result.taxCategoryId = formValue.taxCategoryId;
                result.facetValueIds = formValue.facetValueIds;
                const assetChanges = this.variantAssetChanges[variant.id];
                if (assetChanges) {
                    result.featuredAssetId = assetChanges.featuredAssetId;
                    result.assetIds = assetChanges.assetIds;
                }
                return result;
            })
            .filter(notNullOrUndefined);
    }

    private getProductFormGroup(): FormGroup {
        return this.detailForm.get('product') as FormGroup;
    }

    /**
     * The server may alter the slug value in order to normalize and ensure uniqueness upon saving.
     */
    private updateSlugAfterSave(results: Array<UpdateProductMutation | UpdateProductVariantsMutation>) {
        const firstResult = results[0];
        const slugControl = this.detailForm.get(['product', 'slug']);

        function isUpdateMutation(input: any): input is UpdateProductMutation {
            return input.hasOwnProperty('updateProduct');
        }

        if (slugControl && isUpdateMutation(firstResult)) {
            slugControl.setValue(firstResult.updateProduct.slug, { emitEvent: false });
        }
    }
}
