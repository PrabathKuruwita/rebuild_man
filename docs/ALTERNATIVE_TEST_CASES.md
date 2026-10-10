# Alternative & Negative Functional Test Cases

This document contains functional test cases for **Alternative Flows, Negative Scenarios, Input Validation Failures, Route Guards, and Exception Handling** in the system. These test cases are mapped directly to actual components, validation logic, and API routes in the codebase.

---

## Summary of Columns
1. **Test Case ID**: Unique identifier for traceability (e.g., `ATC_AUTH_001`).
2. **Test Scenario**: High-level overview of the alternative/negative flow.
3. **Test Case Description**: 1-2 sentence description of the specific condition being tested.
4. **Pre-Conditions**: Mandatory state or prerequisite required before test execution.
5. **Test Steps**: Detailed sequence of user actions.
6. **Test Data**: Specific inputs used for test execution.
7. **Expected Result**: Expected visible outcome or system behavior (e.g. error alerts, form block, redirection).
8. **Post-Condition**: System state that must be fulfilled after execution (e.g. no record created, session unchanged).
9. **Actual Result**: Outcome observed during execution.
10. **Status**: Pass or Fail result.
11. **Comments**: Technical context (Frontend Route, Components, Backend API, Validation Logic).

---

### ATC_AUTH_001: Sign-In with Invalid Credentials (Wrong Password / Unregistered User)

*   **Test Case ID**: `ATC_AUTH_001`
*   **Test Scenario**: Authentication Failure Handling
*   **Test Case Description**: Verify that the system denies access and displays an appropriate error message when a user attempts to sign in with incorrect credentials.
*   **Pre-Conditions**:
    1. The user is on the login portal at `/login`.
    2. The user is unauthenticated.
*   **Test Steps**:
    1. Select the **login** tab.
    2. In the **Username** field, enter `johndoe_donor`.
    3. In the **Password** field, enter an incorrect password: `WrongPassword!999`.
    4. Click the **Sign In** button.
    5. Repeat with a non-existent username: `ghost_user_99` / `AnyPassword!123`.
*   **Test Data**:
    *   Scenario A: Username `johndoe_donor` / Password `WrongPassword!999`
    *   Scenario B: Username `ghost_user_99` / Password `AnyPassword!123`
*   **Expected Result**: The sign-in request fails. A prominent red error banner displays `"Invalid username or password"`. No JWT tokens are saved in `localStorage`, and the user remains on the `/login` page.
*   **Post-Condition**: User session remains unauthenticated.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/login`
    *   **Frontend Logic**: [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx#L162-L188) catches the authentication error and updates the `error` state banner.
    *   **Backend Integration**: Triggers `/api/auth/login/` (POST) in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L110-L150) which returns HTTP 400 Bad Request.

---

### ATC_AUTH_002: Sign-In Attempt by Pending (Unapproved) Organization Admin

*   **Test Case ID**: `ATC_AUTH_002`
*   **Test Scenario**: Pending Account Login Block
*   **Test Case Description**: Verify that an Organization Admin whose registration request is still pending approval cannot access the system.
*   **Pre-Conditions**:
    1. An Organization Admin account exists with `approval_status='PENDING'` (e.g. `pending_hospital_admin`).
    2. The user is on `/login`.
*   **Test Steps**:
    1. Select the **login** tab.
    2. In the **Username** field, enter `pending_hospital_admin`.
    3. In the **Password** field, enter the correct password: `PendingPass@123`.
    4. Click the **Sign In** button.
*   **Test Data**:
    *   Username: `pending_hospital_admin`
    *   Password: `PendingPass@123`
*   **Expected Result**: Access is denied. An error banner displays `"Your registration request is pending approval by the administrator."`. No session tokens are stored.
*   **Post-Condition**: Unapproved account cannot enter the admin portal.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/login`
    *   **Backend Logic**: Handled in `custom_login` in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L125-L135), returning HTTP 403 Forbidden with pending status message.

---

### ATC_AUTH_003: Unauthorized Direct URL Navigation (Role-Based Route Guards)

*   **Test Case ID**: `ATC_AUTH_003`
*   **Test Scenario**: Role-Based Access Control (RBAC) Protection
*   **Test Case Description**: Verify that non-admin users (Donors or unauthenticated visitors) are blocked from accessing protected System Admin and Organization Admin routes.
*   **Pre-Conditions**:
    1. The user is logged in as a Donor (`johndoe_donor`) or is completely unauthenticated.
*   **Test Steps**:
    1. In the browser address bar, manually type the System Admin URL: `http://localhost:3000/admin`.
    2. Observe the page redirection.
    3. Manually type the Org Admin URL: `http://localhost:3000/org-admin`.
    4. Observe the page redirection.
    5. Manually type the Approvals management URL: `http://localhost:3000/admin/approvals`.
    6. Observe the page redirection.
*   **Test Data**:
    *   Protected Routes: `/admin`, `/org-admin`, `/admin/approvals`, `/admin/donors`
*   **Expected Result**: The route guard immediately blocks access. Unauthenticated users are redirected to `/login`, and Donor users are redirected back to the Home page (`/`).
*   **Post-Condition**: Admin screens and data are never rendered to unauthorized roles.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Guards**: Handled by `useAdminGuard()` and `useOrgAdminGuard()` hooks in [useAuthGuard.ts](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/lib/useAuthGuard.ts).

---

### ATC_REG_001: Duplicate Username Registration

*   **Test Case ID**: `ATC_REG_001`
*   **Test Scenario**: Duplicate Username Registration
*   **Test Case Description**: Verify that the system prevents registration when the chosen username is already registered in the system.
*   **Pre-Conditions**:
    1. A user already exists with username `sadev_nhsl` and email `pasinduofficial6@gmail.com`.
    2. The user is on `http://rebuild-app.duckdns.org/login` (or `/login`) -> **Organization Register** tab.
*   **Test Steps**:
    1. Enter Organization name: `Homagama Hospital`.
    2. Select Organization type: `Hospital`.
    3. Enter Admin first/last name: `Amal` / `Perera`.
    4. Enter the existing Admin username: `sadev_nhsl`.
    5. Enter the Official email: `pasinduofficial6@gmail.com`.
    6. Fill in Phone: `+94 11 269 3500`.
    7. Enter Password: `SecurePass@123` and Confirm: `SecurePass@123`.
    8. Agree to Terms and click **Submit for Verification**.
*   **Test Data**:
    *   Duplicate Username: `sadev_nhsl`
    *   Email: `pasinduofficial6@gmail.com`
*   **Expected Result**: The registration is rejected. An error alert displays `"A user with that username already exists."` and the form does not submit.
*   **Post-Condition**: No duplicate database record is created.
*   **Actual Result**: Data was submitted. At system admin side pending requests tab, username display as duplicate username with `_1`.
*   **Status**: Fail
*   **Comments**:
    *   **Frontend Route**: `/login` (Org Admin tab)
    *   **Frontend Logic**: [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx#L203-L238) invokes `registerOrgAdmin()`.
    *   **Backend Integration**: Hits endpoint `/api/auth/register-org-admin/` handled by `OrgAdminRegisterView` in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py).
    *   **Root Cause**: In [serializers.py:L132-L140](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/serializers.py#L132-L140), `OrgAdminRegisterSerializer` executes a loop that mutates duplicate usernames by appending `_{counter}` (e.g. `sadev_nhsl_1`) instead of raising a `serializers.ValidationError({"username": "A user with that username already exists."})`.
    *   **Defect Link**: Logged as defect **`BUG_003`** in [BUG_REPORTS.md](file:///c:/Users/thari/Desktop/rebuild_man_project/docs/BUG_REPORTS.md#L40-L53).

---

### ATC_REG_002: Duplicate Email Registration Handling

*   **Test Case ID**: `ATC_REG_002`
*   **Test Scenario**: Duplicate Email Registration Handling
*   **Test Case Description**: Verify that the system prevents registration when the chosen email is already registered in the system.
*   **Pre-Conditions**:
    1. A user already exists with username `prabath_nhsl` and email `probusinessinfinity7@gmail.com`.
    2. The user is on `http://rebuild-app.duckdns.org/login` (or `/login`) -> **Organization Register** tab.
*   **Test Steps**:
    1. Enter Organization name: `Kalutara Hospital`.
    2. Select Organization type: `Hospital`.
    3. Enter Admin first/last name: `Prabath` / `Perera`.
    4. Enter the existing Admin username: `prabath_nhsl`.
    5. Enter the existing Official email: `probusinessinfinity7@gmail.com`.
    6. Fill in Phone: `+94 11 269 3500`.
    7. Enter Password: `SecurePass@123` and Confirm: `SecurePass@123`.
    8. Agree to Terms and click **Submit for Verification**.
*   **Test Data**:
    *   Username: `prabath_nhsl`
    *   Duplicate Email: `probusinessinfinity7@gmail.com`
*   **Expected Result**: The registration is rejected. An error alert displays `"email: A user with this email already exists."` and the form does not submit.
*   **Post-Condition**: No duplicate database record is created.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/login` (Org Admin tab)
    *   **Frontend Logic**: [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx#L203-L238) submits the form via `registerOrgAdmin()` and renders the returned backend error message in the red alert box (`setError`).
    *   **Backend Integration**: Hits endpoint `/api/auth/register-org-admin/` handled by `OrgAdminRegisterView` in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py).
    *   **Backend Validation**: Handled by `OrgAdminRegisterSerializer.validate()` in [serializers.py:L117-L130](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/serializers.py#L117-L130), which checks `User.objects.filter(email=email).first()` and explicitly raises `serializers.ValidationError({"email": "A user with this email already exists."})`, returning HTTP 400 Bad Request.

---

### ATC_REG_003: Registration with Password Mismatch

*   **Test Case ID**: `ATC_REG_003`
*   **Test Scenario**: Password Confirmation Validation
*   **Test Case Description**: Verify that client-side validation blocks registration when the password and confirm password fields do not match.
*   **Pre-Conditions**:
    1. The user is on the registration form (`/login`).
*   **Test Steps**:
    1. In the **Password** field, enter `StrongPassword@123`.
    2. In the **Confirm password** field, enter `DifferentPassword@456`.
    3. Fill in all other mandatory fields and agree to terms.
    4. Click the register button.
*   **Test Data**:
    *   Password: `StrongPassword@123`
    *   Confirm Password: `DifferentPassword@456`
*   **Expected Result**: The form submission is immediately halted on the client side. A red validation message displays `"Passwords do not match"`. No API request is dispatched.
*   **Post-Condition**: Form remains open for correction; no data is sent to server.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Logic**: [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx#L191,L214) performs immediate equality comparison before invoking API helpers.

---

### ATC_REG_004: Donor Registration with Missing Mandatory Fields or Unchecked Terms

*   **Test Case ID**: `ATC_REG_004`
*   **Test Scenario**: Mandatory Field & Terms Validation
*   **Test Case Description**: Verify that donor account creation is blocked if mandatory fields are empty or terms checkbox is unchecked.
*   **Pre-Conditions**:
    1. The user is on `/login` -> **Donor Register** tab.
*   **Test Steps**:
    1. Leave **First Name** and **Email** empty.
    2. Fill Username `testdonor` and Password `Pass@12345`.
    3. Leave the **Terms of Service** checkbox unchecked.
    4. Click **Create Donor Account**.
*   **Test Data**:
    *   Empty fields: First Name, Email, Terms (`false`)
*   **Expected Result**: Browser/HTML5 required validation highlights empty inputs with `"Please fill in this field"`. If terms are unchecked, registration is prevented with `"Please agree to the Terms of Service and Privacy Policy"`.
*   **Post-Condition**: No user account is created.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Components**: [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx) input elements enforce `required` attributes and `termsAccepted` state checks.

---

### ATC_ADMIN_001: Org Admin Rejection without Rejection Reason

*   **Test Case ID**: `ATC_ADMIN_001`
*   **Test Scenario**: Mandatory Rejection Reason Validation
*   **Test Case Description**: Verify that a System Administrator cannot reject an organization registration request without providing an explanation reason.
*   **Pre-Conditions**:
    1. Logged in as System Admin (`sysadmin`).
    2. On `/admin/approvals` dashboard with at least one pending request.
*   **Test Steps**:
    1. Locate a pending organization request.
    2. Click the red cross **Reject** button (opens rejection prompt/modal).
    3. Leave the **Reason for rejection** textarea completely blank (or enter only spaces).
    4. Click the **Confirm Rejection** button.
*   **Test Data**:
    *   Rejection Reason: `""` (empty string)
*   **Expected Result**: The rejection is blocked. An error alert or validation prompt displays `"Please enter a rejection reason."`. The status of the pending request remains unchanged.
*   **Post-Condition**: The pending request is not rejected or deleted.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/admin/approvals`
    *   **Frontend Logic**: [ApprovalsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/approvals/page.tsx#L196-L200) validates `!rejectionReason.trim()` before sending API request.

---

### ATC_ADMIN_002: System Admin Filter / Search with Zero Matching Records

*   **Test Case ID**: `ATC_ADMIN_002`
*   **Test Scenario**: Empty State Display in Approvals & Donors
*   **Test Case Description**: Verify that search queries or filters with zero matching records render clean empty-state UI feedback.
*   **Pre-Conditions**:
    1. Logged in as System Admin (`sysadmin`).
    2. On `/admin/approvals` or `/admin/donors`.
*   **Test Steps**:
    1. In the search box, type a non-existent search term: `ZZZ_NonExistent_999`.
    2. Observe the table/card container.
    3. Change Organization Type dropdown to a category with no records (e.g. `CLINIC`).
*   **Test Data**:
    *   Search Query: `ZZZ_NonExistent_999`
    *   Type Filter: `CLINIC`
*   **Expected Result**: The list clears smoothly and renders a centered empty-state container with message `"No requests found matching your filter"` or `"No donors found"`.
*   **Post-Condition**: Page remains responsive with no uncaught exceptions.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Components**: [ApprovalsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/approvals/page.tsx) and [DonorsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/donors/page.tsx).

---

### ATC_ORG_001: Inviting Secondary Org Admin with Existing Username or Email

*   **Test Case ID**: `ATC_ORG_001`
*   **Test Scenario**: Duplicate Admin Invitation Handling
*   **Test Case Description**: Verify that inviting an administrator with an email or username that already belongs to an existing user is rejected.
*   **Pre-Conditions**:
    1. Logged in as Super Org Admin (`janesilva_org`).
    2. On the `/org-admin/manage-admins` page.
*   **Test Steps**:
    1. In the **Username** field, enter an existing system username: `johndoe_donor`.
    2. In the **Email Address** field, enter `johndoe@example.com`.
    3. Fill Name: `John` / `Doe`, Phone: `+94 77 123 4567`, Password: `TempPass@123`.
    4. Click the **Invite Admin** button.
*   **Test Data**:
    *   Duplicate Username: `johndoe_donor`
    *   Duplicate Email: `johndoe@example.com`
*   **Expected Result**: The invitation fails. A red error banner appears displaying `"User with this username or email already exists"`. The admin is not added to the list.
*   **Post-Condition**: Database remains unaltered.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/org-admin/manage-admins`
    *   **Backend Logic**: `invite_admin` action in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L320-L360) performs existence check on `User.objects.filter(Q(username=...) | Q(email=...))`.

---

### ATC_ORG_002: Creating Section with Empty or Whitespace Name

*   **Test Case ID**: `ATC_ORG_002`
*   **Test Scenario**: Section Name Validation
*   **Test Case Description**: Verify that creating a department/section with an empty or whitespace-only name is prevented.
*   **Pre-Conditions**:
    1. Logged in as Org Admin (`janesilva_org`).
    2. On `/organizations` dashboard.
*   **Test Steps**:
    1. Click the **Add Section** button to open the modal.
    2. Leave the **Section Name** field completely empty, or enter only spaces (`   `).
    3. Enter Head of Section: `Dr. Someone`.
    4. Click the **Add Section** submit button.
*   **Test Data**:
    *   Section Name: `   `
*   **Expected Result**: Submission is halted. An inline error message displays `"Section name is required."`. The modal remains open without dispatching an API call.
*   **Post-Condition**: No section is added to the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Component**: [AddSectionModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/AddSectionModal.tsx#L24-L27) checks `!name.trim()`.

---

### ATC_ORG_003: Creating Need Item with Invalid or Zero Quantity

*   **Test Case ID**: `ATC_ORG_003`
*   **Test Scenario**: Need Item Quantity Validation
*   **Test Case Description**: Verify that an Org Admin cannot create a need item with a required quantity of zero or negative numbers.
*   **Pre-Conditions**:
    1. Logged in as Org Admin (`janesilva_org`).
    2. Inside a Section accordion on `/organizations`.
*   **Test Steps**:
    1. Click **Add Need** inside the section.
    2. Enter Item Name: `Defibrillator`.
    3. In the **Quantity Required** field, enter `0` (or `-10`).
    4. Select Priority: `CRITICAL` and Unit: `UNIT`.
    5. Click the **Add Need** submit button.
*   **Test Data**:
    *   Item Name: `Defibrillator`
    *   Quantity Required: `0`
*   **Expected Result**: The form enforces a minimum value (`min="1"`). Browser validation blocks submission, showing `"Value must be greater than or equal to 1"`.
*   **Post-Condition**: No need item with invalid quantity is stored in the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Component**: [ManualNeedEntryForm.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/ManualNeedEntryForm.tsx) and backend model validator `MinValueValidator(1)`.

---

### ATC_ORG_004: Public Needs Feed Search with No Matching Criteria

*   **Test Case ID**: `ATC_ORG_004`
*   **Test Scenario**: Public Needs Filter Empty State
*   **Test Case Description**: Verify that when a donor searches or filters with criteria matching no needs, an intuitive empty state with a reset option is displayed.
*   **Pre-Conditions**:
    1. The user is on the public Needs board at `/needs`.
*   **Test Steps**:
    1. In the search input field, type: `Unobtainium Medicine XYZ`.
    2. Select Priority Filter: `CRITICAL`.
    3. Observe the rendered grid.
    4. Click the **Clear filters** or **Reset** button.
*   **Test Data**:
    *   Search Query: `Unobtainium Medicine XYZ`
*   **Expected Result**: The needs grid displays `"No needs found matching your criteria"`. Clicking **Clear filters** resets the search input and restores the full list of needs.
*   **Post-Condition**: UI gracefully handles zero-match searches.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/needs`
    *   **Frontend Component**: [NeedsContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/needs/NeedsContent.tsx#L180-L210).

---

### ATC_DON_001: Donor Submits Pledge with Zero or Negative Quantity

*   **Test Case ID**: `ATC_DON_001`
*   **Test Scenario**: Donation Quantity Validation
*   **Test Case Description**: Verify that the donation pledge modal prevents submission if the donation quantity is zero or empty.
*   **Pre-Conditions**:
    1. Logged in as a Donor (`johndoe_donor`).
    2. On `/needs`, with the **Donate** modal open for an active need.
*   **Test Steps**:
    1. In the **Quantity to Donate** field, enter `0` (or `-5`).
    2. Fill in all contact details.
    3. Attempt to click **Submit Pledge**.
*   **Test Data**:
    *   Pledge Quantity: `0`
*   **Expected Result**: The input enforces `min="1"`. If bypassed, an error message displays `"Please enter a valid quantity greater than 0"`, and modal submission is blocked.
*   **Post-Condition**: No pledge is created in the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Component**: [DonateModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/DonateModal.tsx#L98-L115).

---

### ATC_DON_002: Partial Donation Confirmation Workflow (Alternative Path)

*   **Test Case ID**: `ATC_DON_002`
*   **Test Scenario**: Partial Quantity Confirmation
*   **Test Case Description**: Verify that an Org Admin can confirm a partial amount of a pledged donation (e.g. confirming 300 out of 500 units pledged).
*   **Pre-Conditions**:
    1. Logged in as Org Admin (`janesilva_org`).
    2. On `/admin/donations` with a pending donation of 500 units.
*   **Test Steps**:
    1. Locate the pending donation request (quantity 500).
    2. Click the **Confirm** action button.
    3. In the confirmation modal, select the radio option **"Confirm partial quantity"**.
    4. In the partial quantity input, enter `300`.
    5. Click **Confirm Pledge**.
*   **Test Data**:
    *   Pledged Quantity: `500`
    *   Partial Quantity Confirmed: `300`
*   **Expected Result**: The donation status updates to `CONFIRMED` with `quantity_confirmed=300`. The need card progress bar increases based on the 300 confirmed units, and the donor receives a notification stating 300 units were confirmed.
*   **Post-Condition**: The donation record stores `quantity_confirmed=300` and need item confirmed totals are adjusted by +300.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/admin/donations`
    *   **Frontend Logic**: [donations/page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/donations/page.tsx#L210-L245) handles `isPartial` selection and dispatches payload `{ quantity_confirmed: 300 }` to `/api/donations/{id}/confirm/`.

---

### ATC_DON_003: Donation Cancellation Flow with Mandatory Reason Validation

*   **Test Case ID**: `ATC_DON_003`
*   **Test Scenario**: Cancellation Reason Requirement
*   **Test Case Description**: Verify that an Org Admin cannot cancel a donation pledge without providing a mandatory explanation reason.
*   **Pre-Conditions**:
    1. Logged in as Org Admin (`janesilva_org`).
    2. On `/admin/donations` with a pending or confirmed donation.
*   **Test Steps**:
    1. Click the **Cancel** button on a donation card.
    2. In the cancellation dialog, leave the **Reason for cancellation** input empty.
    3. Attempt to click **Confirm Cancellation**.
*   **Test Data**:
    *   Cancellation Reason: `""` (empty string)
*   **Expected Result**: The **Confirm Cancellation** button remains disabled or triggers an error `"Please provide a reason for cancelling this donation"`. The donation status remains `PENDING` or `CONFIRMED`.
*   **Post-Condition**: Donation is not cancelled without an explanation.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Component**: [donations/page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/donations/page.tsx#L250-L280) enforces non-empty `cancelReason.trim()`.

---

### ATC_DON_004: Donor Cancels Donation Modal Interaction

*   **Test Case ID**: `ATC_DON_004`
*   **Test Scenario**: User Modal Dismissal
*   **Test Case Description**: Verify that a donor can dismiss the donation modal without any state mutation or accidental submission.
*   **Pre-Conditions**:
    1. Logged in as a Donor (`johndoe_donor`).
    2. Clicked **Donate** on a need card, opening the modal.
*   **Test Steps**:
    1. Enter partial data (Quantity `100`, Name `John`).
    2. Click the **Cancel** button (or the `X` icon in top right, or click outside the modal backdrop).
    3. Verify the modal closes.
*   **Test Data**:
    *   Partial inputs discarded.
*   **Expected Result**: The modal closes immediately. The parent need card state remains unaffected, and no network request is sent.
*   **Post-Condition**: Database remains unmodified.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Component**: [DonateModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/DonateModal.tsx#L70-L85).

---

### ATC_PROF_001: Password Change with Incorrect Current Password

*   **Test Case ID**: `ATC_PROF_001`
*   **Test Scenario**: Security Verification on Password Change
*   **Test Case Description**: Verify that updating the password fails if the user provides an incorrect current password.
*   **Pre-Conditions**:
    1. Logged in as an authenticated user (`johndoe_donor`).
    2. On the `/profile` page.
*   **Test Steps**:
    1. In the **Change password** section, enter Current Password: `WrongCurrentPass@123`.
    2. Enter New Password: `BrandNewPass@999`.
    3. Enter Confirm New Password: `BrandNewPass@999`.
    4. Click the **Update password** button.
*   **Test Data**:
    *   Current Password: `WrongCurrentPass@123` (incorrect)
    *   New Password: `BrandNewPass@999`
*   **Expected Result**: The update is rejected. A red error notification displays `"Current password is incorrect."`. The existing password remains active.
*   **Post-Condition**: Password hash in database is unchanged.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/profile`
    *   **Frontend Logic**: [ProfilePage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/profile/page.tsx#L125-L145).
    *   **Backend Integration**: Triggers `/api/auth/me/` (PATCH) which validates current password via `user.check_password()`.

---

### ATC_PROF_002: Password Change with Mismatched New Passwords

*   **Test Case ID**: `ATC_PROF_002`
*   **Test Scenario**: New Password Confirmation Mismatch
*   **Test Case Description**: Verify that client-side validation prevents password update when the new password and confirm new password fields differ.
*   **Pre-Conditions**:
    1. Logged in as an authenticated user.
    2. On the `/profile` page.
*   **Test Steps**:
    1. Enter Current Password: `DonorSecure@99`.
    2. Enter New Password: `NewStrongPass@111`.
    3. Enter Confirm New Password: `DifferentNewPass@222`.
    4. Click the **Update password** button.
*   **Test Data**:
    *   New Password: `NewStrongPass@111`
    *   Confirm New Password: `DifferentNewPass@222`
*   **Expected Result**: Form submission is halted immediately. A validation error displays `"New passwords do not match"`. No API request is sent.
*   **Post-Condition**: User profile and credentials remain untouched.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Logic**: [ProfilePage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/profile/page.tsx#L128) checks `newPassword !== confirmPassword`.
