# Functional Test Cases (Positive Scenarios)

This document contains detailed functional test cases for positive scenarios in the system, mapped directly to the actual paths, inputs, actions, and API behaviors found in the developed codebase.

---

## Summary of Columns
1. **Test Case ID**: Unique identifier for traceability (e.g., `TC_ORG_001`).
2. **Test Scenario**: High-level overview of the test flow.
3. **Test Case Description**: 1-2 sentence description of the specific condition being tested.
4. **Pre-Conditions**: Mandatory state or prerequisite required before test execution.
5. **Test Steps**: Detailed sequence of user actions.
6. **Test Data**: Specific inputs used for test execution.
7. **Expected Result**: Expected visible outcome or system behavior.
8. **Post-Condition**: System state that must be fulfilled after successful execution.
9. **Actual Result**: Outcome observed during execution.
10. **Status**: Pass or Fail result.
11. **Comments**: Additional notes or context from the codebase.

---

### TC_ORG_001: Organization Registration

*   **Test Case ID**: `TC_ORG_001`
*   **Test Scenario**: Organization Registration Request
*   **Test Case Description**: Verify that a representative can submit a registration request for their organization via the public interface.
*   **Pre-Conditions**: 
    1. The user is on the login/register portal at `/login`.
    2. The user is currently unauthenticated.
*   **Test Steps**:
    1. Click on the **Organization Register** tab (sets `activeTab` to `"org-admin"`).
    2. In the **Organization name** input field, enter `Lanka General Hospital`.
    3. In the **Organization type** select dropdown, select `Hospital`.
    4. In the **Admin first name** and **Admin last name** fields, enter `Jane` and `Silva`.
    5. In the **Admin username** input field, enter `janesilva_org`.
    6. In the **Official email** input field, enter `contact@lankageneral.lk`.
    7. In the **Phone** input field, enter `+94 11 269 3500`.
    8. In the **Password** input field, enter `LankaPass@123`.
    9. In the **Confirm** password input field, enter `LankaPass@123`.
    10. Click the checkbox agreeing to the Terms of Service and Privacy Policy.
    11. Click the **Submit for Verification** button.
*   **Test Data**:
    *   Organization Name: `Lanka General Hospital`
    *   Organization Type: `HOSPITAL`
    *   First Name: `Jane`
    *   Last Name: `Silva`
    *   Username: `janesilva_org`
    *   Email: `contact@lankageneral.lk`
    *   Phone: `+94 11 269 3500`
    *   Password/Confirm: `LankaPass@123`
    *   Terms: Checked (`true`)
*   **Expected Result**: A browser alert popup appears displaying `"Registration submitted! Awaiting system administrator approval."`. Upon clicking OK, the registration form is reset and the active tab switches back to the sign-in form (`"login"`).
*   **Post-Condition**: A new user record is created in the database with `role='ORG_ADMIN'` and `approval_status='PENDING'`, linked to the requested organization details.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/login` (Org Admin Registration tab).
    *   **Frontend Logic**: Implemented in [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx#L217-L232) via the `registerOrgAdmin` action call.
    *   **Backend Integration**: Triggers the `/api/auth/register-org-admin/` endpoint, creating a pending account.
    *   **Visual Indicators**: Check for browser alert popup confirmation and automatic redirection to the sign-in form.

---

### TC_DONOR_001: Donor Registration

*   **Test Case ID**: `TC_DONOR_001`
*   **Test Scenario**: Donor Account Creation
*   **Test Case Description**: Verify that a new donor can successfully register and create a donor account.
*   **Pre-Conditions**: 
    1. The user is on the login/register portal at `/login`.
    2. The user is currently unauthenticated.
*   **Test Steps**:
    1. Click on the **Donor Register** tab (sets `activeTab` to `"register"`).
    2. In the **Donor first name** and **Donor last name** fields, enter `John` and `Doe`.
    3. In the **Donor username** input field, enter `johndoe_donor`.
    4. In the **Email address** input field, enter `johndoe@example.com`.
    5. In the **Phone number** input field, enter `+94 77 123 4567`.
    6. In the **Password** input field, enter `DonorSecure@99`.
    7. In the **Confirm** password input field, enter `DonorSecure@99`.
    8. Click the checkbox agreeing to the Terms of Service and Privacy Policy.
    9. Click the **Create Donor Account** button.
*   **Test Data**:
    *   First Name: `John`
    *   Last Name: `Doe`
    *   Username: `johndoe_donor`
    *   Email: `johndoe@example.com`
    *   Phone: `+94 77 123 4567`
    *   Password/Confirm: `DonorSecure@99`
    *   Terms: Checked (`true`)
*   **Expected Result**: The account is successfully created, the access/refresh tokens are stored in the browser's localStorage, and the user is automatically logged in and redirected to the Home Page (`/`).
*   **Post-Condition**: A new user record is created in the database with `role='DONOR'` and `approval_status='APPROVED'`.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/login` (Donor Registration tab).
    *   **Frontend Logic**: [LoginContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/login/LoginContent.tsx#L194-L202) calls the context `register` method.
    *   **Authentication State**: Implemented in [AuthContext.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/lib/AuthContext.tsx#L112-L152) which sets JWT credentials in `localStorage` upon success and routes the donor to the Home Page `/`.

---

### TC_ADMIN_001: Approve Organization Registration Request

*   **Test Case ID**: `TC_ADMIN_001`
*   **Test Scenario**: Admin Approval Workflow
*   **Test Case Description**: Verify that a System Administrator can review and approve a pending organization admin registration request.
*   **Pre-Conditions**:
    1. The user is logged in as a System Administrator (`role='ADMIN'`).
    2. The administrator is on the dashboard approvals tab at `/admin/approvals`.
    3. A pending registration request for `Lanka General Hospital` (user `janesilva_org`) exists.
*   **Test Steps**:
    1. On the **Pending** requests tab, locate the card for `Jane Silva` (`janesilva_org`) for `Lanka General Hospital`.
    2. Click the green checkmark **Approve** button.
    3. In the confirmation dialog popup, verify the requester's name is correct and click **Approve**.
*   **Test Data**:
    *   Target Request: User ID corresponding to `janesilva_org`.
*   **Expected Result**: A browser alert message displays `"Admin approved successfully!"`. The registration card is removed from the "Pending" list and is added to the "Approved" requests tab.
*   **Post-Condition**: The user's database status is updated to `approval_status='APPROVED'`, they are linked to the approved organization, a database notification of type `REGISTRATION_DECISION` is created, and an approval confirmation email is triggered.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/admin/approvals` (System Admin Approval dashboard).
    *   **Frontend Logic**: Handled in [ApprovalsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/approvals/page.tsx#L141-L169).
    *   **Backend Integration**: Hits endpoint `/api/admin/approvals/{userId}/approve/` in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L684-L883), moving user status to `APPROVED` and creating an approval transactional email.

---

### TC_ADMIN_002: Reject Organization Registration Request

*   **Test Case ID**: `TC_ADMIN_002`
*   **Test Scenario**: Admin Rejection Workflow
*   **Test Case Description**: Verify that a System Administrator can reject a pending organization admin registration request with a specified reason.
*   **Pre-Conditions**:
    1. The user is logged in as a System Administrator (`role='ADMIN'`).
    2. The administrator is on the dashboard approvals tab at `/admin/approvals`.
    3. A pending registration request for `Fake Clinic` (user `fraud_admin`) exists.
*   **Test Steps**:
    1. On the **Pending** requests tab, locate the card for `fraud_admin` for `Fake Clinic`.
    2. Click the red cross **Reject** (or "Remove") button.
    3. In the rejection form area, type the rejection reason: `The provided medical facility registration license number could not be validated.`
    4. Click the **Confirm Rejection** button.
    5. In the confirmation dialog popup, click **Reject**.
*   **Test Data**:
    *   Target Request: User ID corresponding to `fraud_admin`.
    *   Rejection Reason: `The provided medical facility registration license number could not be validated.`
*   **Expected Result**: A browser alert message displays `"Request rejected successfully!"`. The registration request card is removed from the "Pending" list and appears under the "Rejected" requests tab.
*   **Post-Condition**: The rejection email containing the reason is triggered to the user, and the pending user registration record is deleted from the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/admin/approvals` (System Admin Approval dashboard).
    *   **Frontend Logic**: Handled in [ApprovalsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/approvals/page.tsx#L195-L230).
    *   **Backend Integration**: Triggers endpoint `/api/admin/approvals/{userId}/reject/` in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L885-L930). Sends a rejection reason email and deletes the registration candidate record.

---

### TC_EMAIL_001: Org Requester Approval Notification Email

*   **Test Case ID**: `TC_EMAIL_001`
*   **Test Scenario**: Requester Notification (Approval)
*   **Test Case Description**: Verify that the organization requester receives a transactional email notification containing details when their registration is approved.
*   **Pre-Conditions**:
    1. An organization registration request (e.g., `contact@lankageneral.lk`) has been successfully approved by the System Administrator (TC_ADMIN_001).
*   **Test Steps**:
    1. Access the mailbox for `contact@lankageneral.lk`.
    2. Open the email sent from `NeedTracker` with the subject prefix for approvals.
*   **Test Data**:
    *   Recipient Email: `contact@lankageneral.lk`
*   **Expected Result**: An email is delivered with the subject `"Your ORG_ADMIN Registration Request Has Been Approved – NeedTracker"`. The email body includes the approved username, organization name, date of approval, and a login link to the platform.
*   **Post-Condition**: Transactional approval email is successfully delivered.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Backend Logic**: Handled on registration approval in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L730-L879) via the `send_mail` action.
    *   **Testing Method**: Check standard SMTP log server or inbox for subject: `"Your ORG_ADMIN Registration Request Has Been Approved – NeedTracker"`.

---

### TC_EMAIL_002: Org Requester Rejection Notification Email

*   **Test Case ID**: `TC_EMAIL_002`
*   **Test Scenario**: Requester Notification (Rejection)
*   **Test Case Description**: Verify that the organization requester receives a transactional email notification containing the rejection reason when their registration is rejected.
*   **Pre-Conditions**:
    1. An organization registration request (e.g., `fraud@fakeclinic.com`) has been rejected by the System Administrator (TC_ADMIN_002).
*   **Test Steps**:
    1. Access the mailbox for `fraud@fakeclinic.com`.
    2. Open the email sent from `NeedTracker` with the subject prefix for rejections.
*   **Test Data**:
    *   Recipient Email: `fraud@fakeclinic.com`
*   **Expected Result**: An email is delivered with the subject `"Your ORG_ADMIN Registration Request Has Been Rejected – NeedTracker"`. The email body clearly displays the rejection reason: `"The provided medical facility registration license number could not be validated."`
*   **Post-Condition**: Transactional rejection email is successfully delivered.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Backend Logic**: Triggered on registration rejection in [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L912-L930).
    *   **Testing Method**: Verify inbox delivery for subject: `"Your ORG_ADMIN Registration Request Has Been Rejected – NeedTracker"`, ensuring the exact reason is injected.

---

### TC_AUTH_001: User Sign-In (Role-Based Redirection)

*   **Test Case ID**: `TC_AUTH_001`
*   **Test Scenario**: Valid Credentials Login
*   **Test Case Description**: Verify that Donors, Org Admins, and System Admins can sign in using their valid credentials and are redirected to their appropriate portals.
*   **Pre-Conditions**:
    1. The user has an active, approved account.
    2. The user is on the login portal at `/login`.
*   **Test Steps**:
    1. Select the **login** tab (defaults to active).
    2. **Donor Login**: Enter username `johndoe_donor` and password `DonorSecure@99`. Click **Sign In**. Verify redirection to Home Page (`/`). Log out.
    3. **Org Admin Login**: Enter username `janesilva_org` and password `LankaPass@123`. Click **Sign In**. Verify redirection to Organization Admin page (`/org-admin`). Log out.
    4. **System Admin Login**: Enter username `sysadmin` and password `AdminPass!1`. Click **Sign In**. Verify redirection to System Admin dashboard (`/admin`).
*   **Test Data**:
    *   Donor Credentials: `johndoe_donor` / `DonorSecure@99`
    *   Org Admin Credentials: `janesilva_org` / `LankaPass@123`
    *   System Admin Credentials: `sysadmin` / `AdminPass!1`
*   **Expected Result**: Upon each login, credentials are verified, JWT access and refresh tokens are stored in the browser's localStorage, and the user is redirected to their appropriate route.
*   **Post-Condition**: The user has an active, authenticated session with correct permissions.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Authentication State**: Handled in [AuthContext.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/lib/AuthContext.tsx#L74-L110) which saves access tokens to browser storage.
    *   **Redirection Paths**: Verifies key routing policies: `ADMIN` $\rightarrow$ `/admin`, `ORG_ADMIN` $\rightarrow$ `/org-admin`, and `DONOR` $\rightarrow$ `/`.

---

### TC_ORG_ADMIN_001: Super Org Admin Updates Organization Details

*   **Test Case ID**: `TC_ORG_ADMIN_001`
*   **Test Scenario**: Edit Organization Profile
*   **Test Case Description**: Verify that the Super Organization Admin can update the organization's details (address, description, phone, etc.).
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user has an active organization assigned.
    3. The user is on the Organization management portal `/organizations`.
*   **Test Steps**:
    1. Click the **Edit Organization** button (redirects to `/organizations/{orgId}/edit`).
    2. Update the **Address** field to `No. 55, Colombo Road, Colombo 08`.
    3. Update the **Website** field to `https://lankageneralhospital.lk`.
    4. Update the **Description** field to `Lanka General Hospital is committed to providing excellent health services and critical care to patients in need.`.
    5. Click the **Save Changes** button.
*   **Test Data**:
    *   Address: `No. 55, Colombo Road, Colombo 08`
    *   Website: `https://lankageneralhospital.lk`
    *   Description: `Lanka General Hospital is committed to providing excellent health services and critical care to patients in need.`
*   **Expected Result**: A success notification/toast is displayed, and the page is updated to show the new organization profile details.
*   **Post-Condition**: The organization details are successfully updated in the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/organizations/{id}/edit` (triggered from `/organizations`).
    *   **Frontend Logic**: Implemented in [page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/organizations/%5Bid%5D/edit/page.tsx) and calls `updateOrganization` helper in `lib/api.ts`.
    *   **Backend Integration**: Triggers `/api/organizations/{id}/` (PATCH).

---

### TC_ORG_ADMIN_002: Super Org Admin Deletes Organization

*   **Test Case ID**: `TC_ORG_ADMIN_002`
*   **Test Scenario**: Organization Removal
*   **Test Case Description**: Verify that the Super Org Admin can delete their organization from the system.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the `/organizations` page.
*   **Test Steps**:
    1. Click the **Delete Organization** button.
    2. Verify that a delete confirmation modal appears.
    3. Click **Confirm Delete** in the modal.
*   **Test Data**:
    *   Target Org: ID corresponding to `Lanka General Hospital`.
*   **Expected Result**: The organization record is deleted, a success alert is shown, the page renders the `"No Organization Assigned"` view, and the user's role is unlinked from the deleted organization.
*   **Post-Condition**: The organization and all its cascade-related sections and needs are deleted from the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/organizations` dashboard profile action.
    *   **Frontend Logic**: Implemented in [organizations/page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/organizations/page.tsx#L186-L204) via `handleDelete` function.
    *   **Backend Integration**: Calls API endpoint `/api/organizations/{id}/` (DELETE).

---

### TC_ORG_ADMIN_003: Super Org Admin Invites Other Org Admins

*   **Test Case ID**: `TC_ORG_ADMIN_003`
*   **Test Scenario**: Manage Organization Admins
*   **Test Case Description**: Verify that the Super Org Admin can invite another administrator to help manage their organization.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the `/org-admin/manage-admins` page.
*   **Test Steps**:
    1. In the **Invite New Admin** form, input Username: `assistant_admin`.
    2. Input First Name: `Mary` and Last Name: `Perera`.
    3. Input Email Address: `mary.perera@lankageneral.lk`.
    4. Input Phone: `+94 76 999 5555`.
    5. Input Temporary Password: `TempPass!Mary99`.
    6. Click the **Invite Admin** button.
*   **Test Data**:
    *   Username: `assistant_admin`
    *   First Name: `Mary`
    *   Last Name: `Perera`
    *   Email: `mary.perera@lankageneral.lk`
    *   Phone: `+94 76 999 5555`
    *   Password: `TempPass!Mary99`
*   **Expected Result**: A success message displays `"Admin invited successfully!"`. The new admin is added to the "Current Admins" list.
*   **Post-Condition**: A new user with `role='ORG_ADMIN'` and status `APPROVED` linked to the same organization is created in the database, and an invitation email is sent to `mary.perera@lankageneral.lk`.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/org-admin/manage-admins` panel.
    *   **Frontend Logic**: Implemented in [ManageAdminsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/org-admin/manage-admins/page.tsx#L65-L89).
    *   **Backend Integration**: Triggers `/api/organizations/{orgId}/invite_admin/` (POST) in backend [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L320-L394), creating a pre-approved account. Note that deletion/removal of secondary admins is not supported in the current frontend UI.

---

### TC_ORG_ADMIN_004: Org Admin Updates Profile Details

*   **Test Case ID**: `TC_ORG_ADMIN_004`
*   **Test Scenario**: Profile Management (Org Admin)
*   **Test Case Description**: Verify that organization admins can update their profile information and passwords.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the Profile page `/profile`.
*   **Test Steps**:
    1. In the **Profile details** form, update First Name to `Jane (Updated)` and Last Name to `Silva (Updated)`.
    2. Update Email to `jane.silva.new@lankageneral.lk`.
    3. Click **Save details**.
    4. In the **Change password** form, enter Current Password `LankaPass@123`, New Password `NewLankaPass@123`, and Confirm new password `NewLankaPass@123`.
    5. Click **Update password**.
*   **Test Data**:
    *   First Name: `Jane (Updated)`
    *   Last Name: `Silva (Updated)`
    *   Email: `jane.silva.new@lankageneral.lk`
    *   Passwords: `LankaPass@123` (Current), `NewLankaPass@123` (New/Confirm)
*   **Expected Result**: A success message displays `"Profile updated successfully."` upon details save, and `"Password changed successfully."` upon password update.
*   **Post-Condition**: The admin's user record in the database is updated with the new details and password.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/profile` management page.
    *   **Frontend Logic**: Implemented in [ProfilePage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/profile/page.tsx#L98-L138) (`handleProfileSave` and `handlePasswordSave`).
    *   **Backend Integration**: Sends updates via `/api/auth/me/` (PATCH) endpoint.

---

### TC_DONOR_002: Donor Updates Profile details

*   **Test Case ID**: `TC_DONOR_002`
*   **Test Scenario**: Profile Management (Donor)
*   **Test Case Description**: Verify that donor users can update their profile details and change their passwords.
*   **Pre-Conditions**:
    1. The user is logged in as a Donor (`johndoe_donor`).
    2. The user is on the Profile page `/profile`.
*   **Test Steps**:
    1. In the **Profile details** form, update First Name to `John (Updated)` and Last Name to `Doe (Updated)`.
    2. Update Email to `john.doe.new@example.com`.
    3. Click **Save details**.
    4. In the **Change password** form, enter Current Password `DonorSecure@99`, New Password `NewDonorSecure@99`, and Confirm new password `NewDonorSecure@99`.
    5. Click **Update password**.
*   **Test Data**:
    *   First Name: `John (Updated)`
    *   Last Name: `Doe (Updated)`
    *   Email: `john.doe.new@example.com`
    *   Passwords: `DonorSecure@99` (Current), `NewDonorSecure@99` (New/Confirm)
*   **Expected Result**: A success message displays `"Profile updated successfully."` upon details save, and `"Password changed successfully."` upon password update.
*   **Post-Condition**: The donor's user record in the database is updated with the new details.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/profile` management page.
    *   **Frontend Logic**: Implemented in [ProfilePage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/profile/page.tsx#L98-L138).
    *   **Backend Integration**: Triggers update request `/api/auth/me/` (PATCH). Note that user profile deletion is not exposed in the frontend UI and must be processed through backend administration.

---

### TC_ORG_ADMIN_005: Org Admin Manages Sections (Create/Update/Delete)

*   **Test Case ID**: `TC_ORG_ADMIN_005`
*   **Test Scenario**: Organization Section Operations
*   **Test Case Description**: Verify that an Org Admin can create, edit, and delete internal sections/departments.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the `/organizations` dashboard for their organization.
*   **Test Steps**:
    1. **Create**: Click **Add Section**. Enter Name: `ICU Ward` and Head: `Dr. Perera`. Click **Save** (or submit).
    2. **Edit**: Click the edit (pencil) icon next to the section card. Change Name: `ICU Pediatric` and Head: `Dr. Perera (Updated)`. Click **Save**.
    3. **Delete**: Click the delete (trash) icon next to the section. In the confirmation modal, click **Confirm Delete**.
*   **Test Data**:
    *   Create: Name: `ICU Ward`, Head: `Dr. Perera`
    *   Edit: Name: `ICU Pediatric`, Head: `Dr. Perera (Updated)`
*   **Expected Result**:
    *   Creating/Editing: The section list is updated instantly, displaying the new/edited section.
    *   Deleting: The section card is removed from the dashboard.
*   **Post-Condition**: The section is added, updated, or removed in the database, along with cascade-deleted needs.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/organizations` dashboard.
    *   **Frontend Components**: [AddSectionModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/AddSectionModal.tsx) and [EditSectionModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/EditSectionModal.tsx).
    *   **Backend Integration**: Triggers `/api/sections/` CRUD actions, dynamically refreshing the hierarchy views.

---

### TC_ORG_ADMIN_006: Org Admin Manages Needs Manually (Create/Update/Delete)

*   **Test Case ID**: `TC_ORG_ADMIN_006`
*   **Test Scenario**: Need Item Operations (Manual)
*   **Test Case Description**: Verify that an Org Admin can manually create, update, and delete individual needs within a section.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the `/organizations` page.
    3. A section named `ICU Pediatric` exists.
*   **Test Steps**:
    1. **Create**: Click **Add Need** inside `ICU Pediatric` accordion. In the form, enter Name: `Surgical Gloves`, select Priority: `ESSENTIAL`, enter Quantity Required: `1000`, select Unit: `Units` (or `UNIT`), and enter Description: `Sterile surgical gloves size 7.5.`. Click **Add Need**.
    2. **Edit**: Click the edit icon on the `Surgical Gloves` card. Update Quantity Required: `1500` and select Priority: `CRITICAL`. Click **Save Changes**.
    3. **Delete**: Click the delete (trash) icon on the need card. In the modal, click **Confirm Delete**.
*   **Test Data**:
    *   Need: Name: `Surgical Gloves`, Priority: `ESSENTIAL` (edited to `CRITICAL`), Quantity: `1000` (edited to `1500`), Unit: `UNIT`, Description: `Sterile surgical gloves size 7.5.`
*   **Expected Result**:
    *   Creating/Editing: The need is listed with its quantity, unit, description, progress bar at 0%, and critical/essential priority badge.
    *   Deleting: The need card disappears from the section.
*   **Post-Condition**: The need item is added, updated, or deleted in the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/organizations` section accordion items.
    *   **Frontend Components**: [ManualNeedEntryForm.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/ManualNeedEntryForm.tsx) and [EditNeedModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/EditNeedModal.tsx).
    *   **Backend Integration**: Triggers `/api/needs/` CRUD endpoints, refreshing the parent organization state upon modal close.

---

### TC_ORG_ADMIN_007: Org Admin Adds Needs via AI Document Processing

*   **Test Case ID**: `TC_ORG_ADMIN_007`
*   **Test Scenario**: AI-Powered Need Extraction
*   **Test Case Description**: Verify that an Org Admin can upload a request document to automatically extract needs list via AI.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the Document Processing page `/documents`.
*   **Test Steps**:
    1. Drag and drop or browse to select a medical request PDF: `hospital_need_list.pdf`.
    2. Click **Upload Document**. (The document status shows `PENDING` -> `PROCESSED`).
    3. Click the **Review** button next to the processed document.
    4. Review the AI-extracted JSON preview showing item names, quantities, and priorities.
    5. Click the **Approve and Add Needs** button.
*   **Test Data**:
    *   File: `hospital_need_list.pdf` (containing items list).
*   **Expected Result**: The file uploads and is processed. A preview of the extracted items is rendered. Upon approval, the needs are created in the organization sections, and the document status updates to `APPROVED`.
*   **Post-Condition**: Needs extracted from the document are populated as active NeedItems in the database.
*   **Actual Result**: The uploaded file is not processed. After the button displays "Processing...", the file upload resets and the screen returns to the default "No documents uploaded yet" state. No document list is updated or shown.
*   **Status**: Fail
*   **Comments**: The frontend upload handler `handleUpload` in [documents/page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/documents/page.tsx#L38-L46) is currently a mock simulation and does not integrate with the backend API `uploadDocument` function. Thus, documents are not sent to the database.

---

### TC_DONOR_003: Needs Visibility for Donors

*   **Test Case ID**: `TC_DONOR_003`
*   **Test Scenario**: Public Needs Feed
*   **Test Case Description**: Verify that newly created needs are publicly visible to donors on the Needs board.
*   **Pre-Conditions**:
    1. A need item `Surgical Gloves` has been added by `Lanka General Hospital` (TC_ORG_ADMIN_006).
    2. The user is on the public Needs page `/needs`.
*   **Test Steps**:
    1. In the search input field, type `Surgical Gloves`.
    2. Select Priority Filter: `Critical`.
    3. Locate the need card in the grid results.
*   **Test Data**:
    *   Search Query: `Surgical Gloves`
    *   Priority Filter: `Critical`
*   **Expected Result**: The card for `Surgical Gloves` is displayed, showing `Lanka General Hospital • ICU Pediatric`, progress bar at 0%, needed quantity `1500`, and a **Donate** button.
*   **Post-Condition**: real-time NeedItem details are successfully retrieved from `/api/needs/`.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/needs` (Public Board).
    *   **Frontend Components**: Implemented in [NeedsContent.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/needs/NeedsContent.tsx) (local sorting and queries filtering) rendering [NeedCard.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/NeedCard.tsx) cards.
    *   **Backend Integration**: Fetches list data from `/api/needs/`.

---

### TC_DONOR_004: Donor Submits Donation Pledge (Private/Gov Types)

*   **Test Case ID**: `TC_DONOR_004`
*   **Test Scenario**: Pledge Creation Workflow
*   **Test Case Description**: Verify that a logged-in donor can request a pledge for a need, choosing between private and government donor types.
*   **Pre-Conditions**:
    1. The user is logged in as a Donor (`johndoe_donor`).
    2. The user is on `/needs` showing the card for `Surgical Gloves`.
*   **Test Steps**:
    1. Click the **Donate** button on the `Surgical Gloves` card (opens the "Make a Donation" modal).
    2. In the **Quantity to Donate** field, enter `500`.
    3. In the **Estimated Delivery Date** field, enter `2026-09-10`.
    4. **Private Donor Flow**: Choose donor type `private`. Enter Donor Name: `John Doe`, Email: `johndoe@example.com`, Phone: `+94 77 123 4567`, Address: `No. 12, Galle Road, Colombo 03`. Click **Submit Pledge**.
    5. **Government Donor Flow**: Open the modal again. Choose donor type `government`. Enter Department: `Ministry of Health`, Program: `National Care Distribution`, Officer Name: `Dr. Wickrama`, Designation: `Director`, Contact: `+94 11 200 1100`, Email: `director@moh.gov.lk`. Click **Submit Pledge**.
*   **Test Data**:
    *   Pledge quantity: `500`
    *   Private Donor details: Name `John Doe`, Email `johndoe@example.com`, Phone `+94 77 123 4567`, Address `No. 12, Galle Road, Colombo 03`.
    *   Government Donor details: Department `Ministry of Health`, Program `National Care Distribution`, Officer Name `Dr. Wickrama`, Designation `Director`, Contact `+94 11 200 1100`, Email `director@moh.gov.lk`.
*   **Expected Result**: A success screen displays `"Donation Submitted Successfully!"` with a green checkmark. The modal closes automatically after 3 seconds, triggering parent state refresh.
*   **Post-Condition**: A new Donation pledge is recorded in the database with status `PENDING`, awaiting hospital admin verification.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Modal**: [DonateModal.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/DonateModal.tsx#L70-L158) triggered from `/needs` need card.
    *   **Backend Integration**: Submits pledge payload to `/api/donations/` (POST), creating a pledge instance linked to the donor ID and targeting need item.

---

### TC_ORG_ADMIN_008: Org Admin Manages Donation Requests (Confirm/Cancel/Receive)

*   **Test Case ID**: `TC_ORG_ADMIN_008`
*   **Test Scenario**: Donation Management Workflow
*   **Test Case Description**: Verify that organization admins can confirm, cancel (with reason), or mark donation requests as received.
*   **Pre-Conditions**:
    1. The user is logged in as an Org Admin (`janesilva_org`).
    2. The user is on the `/admin/donations` dashboard.
    3. Incoming pending donations (ID #200 and ID #201) exist for `Surgical Gloves`.
*   **Test Steps**:
    1. **Confirm**: Locate donation request #200 (quantity 500). Click **Confirm**. Select `"Confirm full quantity"` and click **Confirm Pledge**. Verify status changes to `CONFIRMED`.
    2. **Receive (Fulfill)**: Click **Mark Received** on confirmed donation #200. In the modal, click **Confirm Received**. Verify status changes to `FULFILLED`.
    3. **Cancel**: Locate pending donation #201 (quantity 500). Click **Cancel**. Enter reason: `The hospital has already met its target for this item through another donor contribution.` Click **Confirm Cancellation**. Verify status changes to `CANCELLED`.
*   **Test Data**:
    *   Confirm ID: `200`
    *   Receive ID: `200`
    *   Cancel ID: `201`, Reason: `The hospital has already met its target for this item through another donor contribution.`
*   **Expected Result**:
    *   Confirming changes status to `CONFIRMED`.
    *   Marking received changes status to `FULFILLED`.
    *   Cancelling changes status to `CANCELLED`.
    *   The lists refresh and update indicators on screen.
*   **Post-Condition**: The Donation status is updated in the database, which automatically updates the NeedItem confirmed quantities.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/admin/donations` portal.
    *   **Frontend Logic**: Implemented in [donations/page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/donations/page.tsx#L181-L292).
    *   **Backend Integration**: Calls specific actions `/api/donations/{id}/confirm/` (POST), `/api/donations/{id}/cancel/` (POST), and `/api/donations/{id}/receive/` (POST) to advance donation status.

---

### TC_DONOR_005: Donation Flow Notifications and Email Alerts

*   **Test Case ID**: `TC_DONOR_005`
*   **Test Scenario**: Donor Notification on Donation Updates
*   **Test Case Description**: Verify that donors are notified via database notifications and emails according to the organization admin's actions (confirm, cancel, receive).
*   **Pre-Conditions**:
    1. The donor's pledge (johndoe_donor) has been updated by the Org Admin (TC_ORG_ADMIN_008).
*   **Test Steps**:
    1. Log in as Donor (`johndoe_donor`).
    2. Click on the Notifications bell icon in the navigation bar. Check the list.
    3. Check the donor's email inbox (`johndoe@example.com`).
*   **Test Data**:
    *   Recipient Email: `johndoe@example.com`
*   **Expected Result**:
    *   Database Notifications show: `"Donation Pledge Confirmed"`, `"Donation Pledge Cancelled by Hospital"`, or `"Donation Received!"` with descriptions.
    *   Transactional Emails are delivered with subjects: `"Donation Confirmed: Lanka General Hospital – NeedTracker"`, `"Donation Cancelled: Lanka General Hospital – NeedTracker"`, or `"Donation Received: Thank You! – NeedTracker"`.
*   **Post-Condition**: Notifications are successfully delivered and read statuses can be managed.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Backend Notifications**: Handled in backend [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L1586-L1596,L1648-L1655,L1680-L1687) creating database records of type `Notification`.
    *   **Transactional Emails**: Triggered automatically upon action confirmation inside backend view handlers.

---

### TC_DONOR_006: Need Card Progression and Fulfillment Updates

*   **Test Case ID**: `TC_DONOR_006`
*   **Test Scenario**: Need Card Real-Time Calculations
*   **Test Case Description**: Verify that the Need Card progress bar, confirmed count, and needed status updates dynamically according to donor and admin actions.
*   **Pre-Conditions**:
    1. A need card for `Surgical Gloves` exists (1500 required, 0 confirmed).
*   **Test Steps**:
    1. Donor submits a pledge for 500 gloves. View card progress.
    2. Admin confirms the 500 gloves donation. View card progress.
    3. Confirm other donations totaling 1000 gloves (making total confirmed 1500). View card progress.
*   **Test Data**:
    *   Pledges and confirmations.
*   **Expected Result**:
    *   Step 1: Progress is still 0% (0 confirmed), but subtext shows `(500 received)` as pending.
    *   Step 2: Progress bar fills to 33% (500 confirmed), needed count shows `1000 Units`.
    *   Step 3: Progress bar fills to 100% (green), Needed count shows `0 Units`, **Donate** button is hidden, and badge `"✓ Requirement Fulfilled"` is displayed.
*   **Post-Condition**: The need card display matches the database records.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Components**: Math calculations and visual indicators reside in [NeedCard.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/components/NeedCard.tsx#L37-L43,L123-L196).
    *   **Style Triggers**: Progression uses Tailwind and custom CSS transitions defined in `components/NeedCard.css` matching current parameters.

---

### TC_ADMIN_003: System Admin Views and Deletes Organizations

*   **Test Case ID**: `TC_ADMIN_003`
*   **Test Scenario**: System-Wide Organization Management
*   **Test Case Description**: Verify that the System Admin can view all registered organizations and delete any organization.
*   **Pre-Conditions**:
    1. The user is logged in as System Admin (`sysadmin`).
    2. The user is on the Organizations page `/organizations`.
*   **Test Steps**:
    1. On the search input, type `Lanka General Hospital`.
    2. Click **View Details** on the hospital card.
    3. Click the **Delete Organization** (trash bin) icon next to the organization details.
    4. In the deletion confirmation modal, click **Confirm Delete**.
*   **Test Data**:
    *   Target Org Name: `Lanka General Hospital`
*   **Expected Result**: The System Admin can view all registered organizations. Searching by name filters the cards. Deletion removes the organization card from the feed.
*   **Post-Condition**: The organization record is deleted from the database.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/organizations` feed (System Admin view).
    *   **Frontend Logic**: [organizations/page.tsx](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/organizations/page.tsx#L297-L445) displays search/filter components for `ADMIN` role.
    *   **Backend Integration**: Calls `/api/organizations/{id}/` (DELETE) upon confirmation.

---

### TC_ADMIN_004: System Admin Views Donor's Details

*   **Test Case ID**: `TC_ADMIN_004`
*   **Test Scenario**: Donor Monitoring List
*   **Test Case Description**: Verify that the System Admin can view registered donor accounts, search them, and view their donation counts.
*   **Pre-Conditions**:
    1. The user is logged in as System Admin (`sysadmin`).
    2. The user is on the Registered Donors page `/admin/donors`.
*   **Test Steps**:
    1. Verify that the table renders all columns (Username, Full Name, Email, Phone, Joined Date, Total Donations).
    2. In the search input field, type `johndoe`.
    3. Verify that the grid filters down to `johndoe_donor`.
    4. Click the clear `X` button on the search bar.
*   **Test Data**:
    *   Search Query: `johndoe`
*   **Expected Result**: The list of registered donors is displayed. Searching matches username, email, full name, or joined date. The totals badge displays correct total donations.
*   **Post-Condition**: The page renders database records from `/api/donors/`.
*   **Actual Result**: As expected
*   **Status**: Pass
*   **Comments**:
    *   **Frontend Route**: `/admin/donors` portal.
    *   **Frontend Logic**: Handled in [DonorsPage](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/admin/donors/page.tsx#L94-L207) with automated polling interval updates.
    *   **Backend Integration**: Fetches registered donors collection via `/api/donors/` (GET).

---
