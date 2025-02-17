/**
 * External dependencies
 */
import { getSetting } from '@woocommerce/settings';

/**
 * Internal dependencies
 */
import { PAYMENT_METHOD_NAME } from './constants';
import { PaymentRequestExpress } from './payment-request-express';
import { applePayImage } from './apple-pay-preview';
import {
	getStripeServerData,
	loadStripe,
	createPaymentRequestUsingCart,
} from '../stripe-utils';

const ApplePayPreview = () => <img src={ applePayImage } alt="" />;

const componentStripePromise = loadStripe();

const paymentRequestPaymentMethod = {
	name: PAYMENT_METHOD_NAME,
	content: <PaymentRequestExpress stripe={ componentStripePromise } />,
	edit: <ApplePayPreview />,
	canMakePayment: ( cartData ) => {
		// If in the editor context, always return true to display the `edit` prop preview.
		// https://github.com/woocommerce/woocommerce-gutenberg-products-block/issues/4101.
		if ( getStripeServerData()?.isAdmin ?? false ) {
			return true;
		}

		if ( ! getStripeServerData()?.shouldShowPaymentRequestButton ) {
			return false;
		}

		return loadStripe().then( ( stripe ) => {
			// Create a payment request and check if we can make a payment to determine whether to
			// show the Payment Request Button or not. This is necessary because a browser might be
			// able to load the Stripe JS object, but not support Payment Requests.
			const fakeCart = {
				total: {
					label: 'Total',
					amount: parseInt(
						cartData?.cartTotals?.total_price ?? 0,
						10
					),
					pending: true,
				},
				currency: cartData?.cartTotals?.currency_code?.toLowerCase(),
				country_code: getSetting( 'baseLocation', {} )?.country,
				displayItems: [],
				shipping_required: false,
			};
			const paymentRequest = createPaymentRequestUsingCart(
				stripe,
				fakeCart
			);

			return paymentRequest.canMakePayment();
		} );
	},
	paymentMethodId: 'stripe',
	supports: {
		features: getStripeServerData()?.supports ?? [],
	},
};

export default paymentRequestPaymentMethod;
