import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';

import {
    ActionBarComponent,
    ActionBarLeftComponent,
    ActionBarRightComponent,
} from './components/action-bar/action-bar.component';
import { AffixedInputComponent } from './components/affixed-input/affixed-input.component';
import { PercentageSuffixInputComponent } from './components/affixed-input/percentage-suffix-input.component';
import { ChipComponent } from './components/chip/chip.component';
import { ConfigurableInputComponent } from './components/configurable-input/configurable-input.component';
import { CurrencyInputComponent } from './components/currency-input/currency-input.component';
import { CustomFieldControlComponent } from './components/custom-field-control/custom-field-control.component';
import { CustomerLabelComponent } from './components/customer-label/customer-label.component';
import { DataTableColumnComponent } from './components/data-table/data-table-column.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DropdownItemDirective } from './components/dropdown/dropdown-item.directive';
import { DropdownMenuComponent } from './components/dropdown/dropdown-menu.component';
import { DropdownTriggerDirective } from './components/dropdown/dropdown-trigger.directive';
import { DropdownComponent } from './components/dropdown/dropdown.component';
import { FacetValueChipComponent } from './components/facet-value-chip/facet-value-chip.component';
import { FacetValueSelectorComponent } from './components/facet-value-selector/facet-value-selector.component';
import { FormFieldControlDirective } from './components/form-field/form-field-control.directive';
import { FormFieldComponent } from './components/form-field/form-field.component';
import { FormItemComponent } from './components/form-item/form-item.component';
import { FormattedAddressComponent } from './components/formatted-address/formatted-address.component';
import { ItemsPerPageControlsComponent } from './components/items-per-page-controls/items-per-page-controls.component';
import { LabeledDataComponent } from './components/labeled-data/labeled-data.component';
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
import { DialogButtonsDirective } from './components/modal-dialog/dialog-buttons.directive';
import { DialogComponentOutletComponent } from './components/modal-dialog/dialog-component-outlet.component';
import { DialogTitleDirective } from './components/modal-dialog/dialog-title.directive';
import { ModalDialogComponent } from './components/modal-dialog/modal-dialog.component';
import { OrderStateLabelComponent } from './components/order-state-label/order-state-label.component';
import { PaginationControlsComponent } from './components/pagination-controls/pagination-controls.component';
import { RichTextEditorComponent } from './components/rich-text-editor/rich-text-editor.component';
import { SelectToggleComponent } from './components/select-toggle/select-toggle.component';
import { SimpleDialogComponent } from './components/simple-dialog/simple-dialog.component';
import { TableRowActionComponent } from './components/table-row-action/table-row-action.component';
import { TitleInputComponent } from './components/title-input/title-input.component';
import { CurrencyNamePipe } from './pipes/currency-name.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { SentenceCasePipe } from './pipes/sentence-case.pipe';
import { SortPipe } from './pipes/sort.pipe';
import { StringToColorPipe } from './pipes/string-to-color.pipe';
import { ModalService } from './providers/modal/modal.service';
import { CanDeactivateDetailGuard } from './providers/routing/can-deactivate-detail-guard';

const IMPORTS = [
    ClarityModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgSelectModule,
    NgxPaginationModule,
    TranslateModule,
    OverlayModule,
];

const DECLARATIONS = [
    ActionBarComponent,
    ActionBarLeftComponent,
    ActionBarRightComponent,
    ConfigurableInputComponent,
    AffixedInputComponent,
    ChipComponent,
    CurrencyInputComponent,
    CurrencyNamePipe,
    CustomerLabelComponent,
    CustomFieldControlComponent,
    DataTableComponent,
    DataTableColumnComponent,
    FacetValueSelectorComponent,
    ItemsPerPageControlsComponent,
    PaginationControlsComponent,
    TableRowActionComponent,
    FacetValueChipComponent,
    FileSizePipe,
    FormFieldComponent,
    FormFieldControlDirective,
    FormItemComponent,
    ModalDialogComponent,
    PercentageSuffixInputComponent,
    DialogComponentOutletComponent,
    DialogButtonsDirective,
    DialogTitleDirective,
    SelectToggleComponent,
    LanguageSelectorComponent,
    RichTextEditorComponent,
    SimpleDialogComponent,
    TitleInputComponent,
    SentenceCasePipe,
    DropdownComponent,
    DropdownMenuComponent,
    SortPipe,
    DropdownTriggerDirective,
    DropdownItemDirective,
    OrderStateLabelComponent,
    FormattedAddressComponent,
    LabeledDataComponent,
    StringToColorPipe,
];

@NgModule({
    imports: IMPORTS,
    exports: [...IMPORTS, ...DECLARATIONS],
    declarations: DECLARATIONS,
    providers: [
        // This needs to be shared, since lazy-loaded
        // modules have their own entryComponents which
        // are unknown to the CoreModule instance of ModalService.
        // See https://github.com/angular/angular/issues/14324#issuecomment-305650763
        ModalService,
        CanDeactivateDetailGuard,
    ],
    entryComponents: [ModalDialogComponent, SimpleDialogComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SharedModule {}
