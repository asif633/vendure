import { RequestContext } from '../../../api/common/request-context';
import { Transitions } from '../../../common/finite-state-machine';
import { Order } from '../../../entity/order/order.entity';

/**
 * @description
 * These are the default states of the Order process. They can be augmented via
 * the `transtitions` property in the {@link OrderProcessOptions}.
 *
 * @docsCategory orders
 */
export type OrderState =
    | 'AddingItems'
    | 'ArrangingPayment'
    | 'PaymentAuthorized'
    | 'PaymentSettled'
    | 'PartiallyFulfilled'
    | 'Fulfilled'
    | 'Cancelled';

export const orderStateTransitions: Transitions<OrderState> = {
    AddingItems: {
        to: ['ArrangingPayment'],
    },
    ArrangingPayment: {
        to: ['PaymentAuthorized', 'PaymentSettled', 'AddingItems'],
    },
    PaymentAuthorized: {
        to: ['PaymentSettled', 'Cancelled'],
    },
    PaymentSettled: {
        to: ['PartiallyFulfilled', 'Fulfilled', 'Cancelled'],
    },
    PartiallyFulfilled: {
        to: ['Fulfilled', 'PartiallyFulfilled', 'Cancelled'],
    },
    Fulfilled: {
        to: ['Cancelled'],
    },
    Cancelled: {
        to: [],
    },
};

export interface OrderTransitionData {
    ctx: RequestContext;
    order: Order;
}
