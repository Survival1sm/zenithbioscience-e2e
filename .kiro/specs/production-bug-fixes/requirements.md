# Requirements Document

## Introduction

This document specifies the requirements for fixing production bugs discovered during E2E test execution. The test suite revealed 33 failures across multiple categories including data seeding issues, frontend security vulnerabilities, backend API errors, and test assertion mismatches.

## Glossary

- **E2E_Test_Suite**: The Playwright-based end-to-end test suite for the Zenith Bioscience application
- **DataSeeder**: The TypeScript module responsible for seeding test data into MongoDB before E2E tests
- **AdminGuard**: The Next.js frontend component that protects admin routes from unauthorized access
- **Backend_API**: The Spring Boot REST API serving the Zenith Bioscience application
- **Frontend**: The Next.js application serving the Zenith Bioscience web interface
- **MongoDB**: The NoSQL database storing application data
- **Order_History_Page**: The account page displaying a user's order history
- **COA_Submission_Page**: The account page for submitting Certificates of Analysis
- **Admin_Dashboard**: The administrative interface for managing the application

## Requirements

### Requirement 1: Order History Data Seeding

**User Story:** As a test user, I want to see my seeded orders on the order history page, so that order history tests can verify the correct display of orders.

#### Acceptance Criteria

1. WHEN the DataSeeder runs THEN the DataSeeder SHALL create orders 24-30 for the accountOrders user (e2e-account-orders-001)
2. WHEN the accountOrders user navigates to /account/orders THEN the Order_History_Page SHALL display the seeded orders
3. WHEN orders are seeded THEN the orders SHALL have various statuses (PENDING, CONFIRMED, SHIPPED, DELIVERED, COMPLETED, PROCESSING, CANCELLED)
4. WHEN the order history page loads THEN the Frontend SHALL fetch orders from the Backend_API using the authenticated user's ID

### Requirement 2: COA Submission Data Seeding

**User Story:** As a test user, I want to have completed orders available for COA submission, so that COA submission tests can verify the multi-step form functionality.

#### Acceptance Criteria

1. WHEN the DataSeeder runs THEN the DataSeeder SHALL create at least 2 DELIVERED or COMPLETED orders for the accountCoa user (e2e-account-coa-001)
2. WHEN the accountCoa user navigates to /account/coa THEN the COA_Submission_Page SHALL display the order selection dropdown with eligible orders
3. WHEN orders are seeded for COA THEN the orders SHALL have status DELIVERED or COMPLETED to be eligible for COA submission

### Requirement 3: Admin Access Control Security Fix

**User Story:** As a security-conscious administrator, I want non-admin users to be blocked from accessing admin pages, so that sensitive administrative functions are protected.

#### Acceptance Criteria

1. WHEN a non-admin user navigates to /admin THEN the AdminGuard SHALL redirect the user to the home page (/)
2. WHEN an unauthenticated user navigates to /admin THEN the AdminGuard SHALL redirect the user to the login page (/account/login)
3. WHEN a non-admin user attempts to access any admin route (/admin/*) THEN the AdminGuard SHALL prevent access and redirect away
4. IF the AdminGuard cannot redirect THEN the AdminGuard SHALL display an "Access Denied" message
5. WHEN an admin user navigates to /admin THEN the AdminGuard SHALL allow access to the admin dashboard

### Requirement 4: Login Error Message Consistency

**User Story:** As a user attempting to log in, I want to see clear error messages when login fails, so that I understand why authentication failed.

#### Acceptance Criteria

1. WHEN a user submits invalid credentials THEN the Login_Page SHALL display an error message containing "invalid" or "incorrect" or "credentials"
2. WHEN an unverified user attempts to log in THEN the Login_Page SHALL display an error message indicating the account is not activated
3. WHEN a user submits a wrong password for a valid email THEN the Login_Page SHALL display an error message about invalid credentials
4. THE error messages SHALL be specific enough to help users understand the issue without revealing security-sensitive information

### Requirement 5: Registration Validation Error Display

**User Story:** As a user registering for an account, I want to see clear validation errors when my input is invalid, so that I can correct my mistakes.

#### Acceptance Criteria

1. WHEN a user submits mismatched passwords THEN the Registration_Page SHALL display an error message containing "match" or "same" or "identical"
2. WHEN a user submits an email that already exists THEN the Registration_Page SHALL display an error message containing "already" or "exists" or "registered" or "in use"
3. WHEN validation errors occur THEN the Registration_Page SHALL display the error in a visible alert or field-level error element

### Requirement 6: Forgot Password Security (No Information Leak)

**User Story:** As a security-conscious user, I want the forgot password feature to not reveal whether an email exists in the system, so that attackers cannot enumerate valid email addresses.

#### Acceptance Criteria

1. WHEN a user submits any email address (existing or non-existing) to the forgot password form THEN the Backend_API SHALL return a success response
2. WHEN the forgot password request completes THEN the Frontend SHALL display a success message regardless of whether the email exists
3. THE Backend_API SHALL NOT return different responses for existing vs non-existing emails (prevents email enumeration attacks)

### Requirement 7: Admin Order Management API Fix

**User Story:** As an administrator, I want to view and manage orders in the admin dashboard, so that I can process customer orders.

#### Acceptance Criteria

1. WHEN an admin user navigates to /admin/orders THEN the Admin_Orders_Page SHALL successfully load the orders list
2. WHEN the orders API is called THEN the Backend_API SHALL return a valid response with order data
3. IF no orders exist THEN the Admin_Orders_Page SHALL display an empty state message (not an error)
4. WHEN orders are loaded THEN the Admin_Orders_Page SHALL display order information including order number, status, and customer details

### Requirement 8: Test Assertion Updates

**User Story:** As a test maintainer, I want E2E tests to use correct selectors and assertions, so that tests accurately verify application behavior.

#### Acceptance Criteria

1. WHEN login error tests run THEN the tests SHALL assert on the actual error message text displayed by the application
2. WHEN registration validation tests run THEN the tests SHALL use correct selectors for error message elements
3. WHEN admin access tests run THEN the tests SHALL verify actual redirect behavior or access denied messages
4. THE tests SHALL NOT use weak OR-based assertions that can mask failures

### Requirement 9: Flaky Test Stabilization

**User Story:** As a test maintainer, I want flaky tests to be stabilized, so that test results are reliable and consistent.

#### Acceptance Criteria

1. WHEN address management tests run THEN the tests SHALL use proper wait conditions instead of fixed timeouts
2. WHEN password change tests run THEN the tests SHALL handle async operations correctly
3. WHEN resend activation tests run THEN the tests SHALL wait for API responses before asserting
4. WHEN bitcoin payments tests run THEN the tests SHALL handle loading states properly

### Requirement 10: DataSeeder User Creation

**User Story:** As a test infrastructure maintainer, I want all isolated test users to be properly seeded, so that tests have the required user accounts.

#### Acceptance Criteria

1. WHEN the DataSeeder runs THEN the DataSeeder SHALL create all users defined in isolatedTestUsers
2. WHEN users are created THEN the users SHALL have correct passwords, roles, and activation status
3. WHEN the accountOrders user is created THEN the user SHALL have ID 'e2e-account-orders-001'
4. WHEN the accountCoa user is created THEN the user SHALL have ID 'e2e-account-coa-001'

### Requirement 11: Backend Order Listing Endpoint

**User Story:** As a frontend developer, I want the order listing API to return consistent responses, so that the frontend can display orders correctly.

#### Acceptance Criteria

1. WHEN the /api/orders endpoint is called with a valid user token THEN the Backend_API SHALL return orders for that user
2. WHEN the /api/admin/orders endpoint is called with an admin token THEN the Backend_API SHALL return all orders
3. WHEN no orders exist THEN the Backend_API SHALL return an empty array (not an error)
4. WHEN orders are returned THEN each order SHALL include orderNumber, status, customerEmail, and items

### Requirement 12: Frontend Order Fetching

**User Story:** As a user viewing my orders, I want the order history page to correctly fetch and display my orders, so that I can track my purchases.

#### Acceptance Criteria

1. WHEN the order history page loads THEN the Frontend SHALL call the orders API with the authenticated user's token
2. WHEN orders are received THEN the Frontend SHALL display them in a list with status tabs
3. WHEN no orders exist THEN the Frontend SHALL display "You haven't placed any orders yet."
4. WHEN orders exist THEN the Frontend SHALL NOT display the empty state message
