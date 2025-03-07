import { Adjustment, AdjustmentType, CurrencyCode, OrderAddress } from '@vendure/common/lib/generated-types';
import { DeepPartial, ID } from '@vendure/common/lib/shared-types';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, RelationId } from 'typeorm';

import { Calculated } from '../../common/calculated-decorator';
import { idType } from '../../config/config-helpers';
import { OrderState } from '../../service/helpers/order-state-machine/order-state';
import { VendureEntity } from '../base/base.entity';
import { Customer } from '../customer/customer.entity';
import { OrderItem } from '../order-item/order-item.entity';
import { OrderLine } from '../order-line/order-line.entity';
import { Payment } from '../payment/payment.entity';
import { Refund } from '../refund/refund.entity';
import { ShippingMethod } from '../shipping-method/shipping-method.entity';

/**
 * @description
 * An Order is created whenever a {@link Customer} adds an item to the cart. It contains all the
 * information required to fulfill an order: which {@link ProductVariant}s in what quantities;
 * the shipping address and price; any applicable promotions; payments etc.
 *
 * An Order exists in a well-defined state according to the {@link OrderState} type. A state machine
 * is used to govern the transition from one state to another.
 *
 * @docsCategory entities
 */
@Entity()
export class Order extends VendureEntity {
    constructor(input?: DeepPartial<Order>) {
        super(input);
    }

    @Column() code: string;

    @Column('varchar') state: OrderState;

    @Column({ default: true })
    active: boolean;

    @Column({ nullable: true })
    orderPlacedAt?: Date;

    @ManyToOne(type => Customer)
    customer?: Customer;

    @OneToMany(type => OrderLine, line => line.order)
    lines: OrderLine[];

    @Column('simple-json') pendingAdjustments: Adjustment[];

    @Column('simple-json') shippingAddress: OrderAddress;

    @Column('simple-json') billingAddress: OrderAddress;

    @OneToMany(type => Payment, payment => payment.order)
    payments: Payment[];

    @Column('varchar')
    currencyCode: CurrencyCode;

    @Column() subTotalBeforeTax: number;

    @Column() subTotal: number;

    @Column({ type: idType(), nullable: true })
    shippingMethodId: ID | null;

    @ManyToOne(type => ShippingMethod)
    shippingMethod: ShippingMethod | null;

    @Column({ default: 0 })
    shipping: number;

    @Column({ default: 0 })
    shippingWithTax: number;

    @Calculated()
    get totalBeforeTax(): number {
        return this.subTotalBeforeTax + this.promotionAdjustmentsTotal + (this.shipping || 0);
    }

    @Calculated()
    get total(): number {
        return this.subTotal + this.promotionAdjustmentsTotal + (this.shippingWithTax || 0);
    }

    @Calculated()
    get adjustments(): Adjustment[] {
        return this.pendingAdjustments;
    }

    get promotionAdjustmentsTotal(): number {
        return this.adjustments
            .filter(a => a.type === AdjustmentType.PROMOTION)
            .reduce((total, a) => total + a.amount, 0);
    }

    /**
     * Clears Adjustments from all OrderItems of the given type. If no type
     * is specified, then all adjustments are removed.
     */
    clearAdjustments(type?: AdjustmentType) {
        if (!type) {
            this.pendingAdjustments = [];
        } else {
            this.pendingAdjustments = this.pendingAdjustments.filter(a => a.type !== type);
        }
        this.lines.forEach(line => line.clearAdjustments(type));
    }

    getOrderItems(): OrderItem[] {
        return this.lines.reduce(
            (items, line) => {
                return [...items, ...line.items];
            },
            [] as OrderItem[],
        );
    }
}
