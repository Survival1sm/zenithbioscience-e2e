/**
 * Account Page Objects barrel export
 */

export {
  AccountDashboardPage,
  type UserInfo,
  type RecentOrderInfo,
  type NotificationStatus,
  type DashboardSection
} from './AccountDashboardPage';

export { 
  ProfilePage, 
  type ProfileData, 
  type ProfileUpdateData, 
  type NotificationPreferences 
} from './ProfilePage';

export {
  AddressBookPage,
  type AddressData,
  type DisplayedAddress
} from './AddressBookPage';

export {
  PasswordChangePage
} from './PasswordChangePage';

export {
  CoaSubmissionPage,
  type CoaDetailsData,
  type ResubmissionData,
  type CoaSubmissionEntry
} from './CoaSubmissionPage';

export {
  CreditsPage,
  type CreditHistoryEntry,
  type CreditFilters
} from './CreditsPage';

export {
  GdprPage,
  type DeletionResult
} from './GdprPage';

export {
  ActivationPage
} from './ActivationPage';

export {
  ResendActivationPage
} from './ResendActivationPage';

export {
  ForgotPasswordPage
} from './ForgotPasswordPage';

export {
  ResetPasswordPage
} from './ResetPasswordPage';
