/**
 * Page Objects barrel export
 * 
 * Provides easy access to all Page Objects and components
 */

// Base class
export { BasePage } from './BasePage';

// Page Objects
export { LoginPage } from './LoginPage';
export { RegisterPage, type RegistrationData } from './RegisterPage';
export { ShopPage, type ProductCardData, type SortOption } from './ShopPage';
export { ProductDetailPage } from './ProductDetailPage';
export { CartPage, type CartItemData } from './CartPage';
export { CheckoutPage, type ShippingAddressData, type PaymentMethodType } from './CheckoutPage';
export { OrderConfirmationPage, type OrderDetailsData } from './OrderConfirmationPage';
export { OrderHistoryPage, type OrderStatusType, type OrderTabType } from './OrderHistoryPage';

// Checkout Pages
export { 
  BitcoinPaymentPage, 
  type BitcoinPaymentStatus, 
  type BitcoinInvoiceData 
} from './checkout/BitcoinPaymentPage';

// Account Pages
export { 
  AccountDashboardPage, 
  type UserInfo, 
  type RecentOrderInfo, 
  type NotificationStatus, 
  type DashboardSection 
} from './account/AccountDashboardPage';
export { 
  ProfilePage, 
  type ProfileData, 
  type ProfileUpdateData, 
  type NotificationPreferences 
} from './account/ProfilePage';
export { PasswordChangePage } from './account/PasswordChangePage';
export {
  AddressBookPage,
  type AddressData,
  type DisplayedAddress
} from './account/AddressBookPage';
export {
  CoaSubmissionPage,
  type CoaDetailsData,
  type ResubmissionData,
  type CoaSubmissionEntry
} from './account/CoaSubmissionPage';
export {
  CreditsPage,
  type CreditHistoryEntry,
  type CreditFilters
} from './account/CreditsPage';
export {
  GdprPage,
  type DeletionResult
} from './account/GdprPage';

// Components
export { Header } from './components/Header';
export { CartDrawer, type CartItemData as CartDrawerItemData } from './components/CartDrawer';
export { Footer, type SocialLinkData } from './components/Footer';
