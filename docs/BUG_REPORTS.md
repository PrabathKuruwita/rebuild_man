# Defect Bug Reports

This document contains detailed bug reports for the functional test cases that failed during execution on the platform.

---

### Bug Report 1: AI Needs Extraction PDF Upload Mock Implementation

| Field Name | Description & Details |
| --- | --- |
| **1. Bug ID** | `BUG_001` |
| **2. Test Case ID** | [`TC_ORG_ADMIN_007`](file:///c:/Users/thari/Desktop/rebuild_man_project/docs/FUNCTIONAL_TEST_CASES.md#L391-L412) |
| **3. Bug Title** | AI Needs Extraction upload resets to empty state and does not process files due to mock frontend implementation |
| **4. Severity** | **Major** (Blocks a core functional workflow for AI-powered data entry, but manual need entry is still available as a workaround) |
| **5. Priority** | **High** (AI-powered needs extraction is a key requirement of the Organization Admin Console) |
| **6. Steps to Reproduce** | 1. Log in as an Organization Admin (`janesilva_org`).<br>2. Navigate to the AI Uploads dashboard `/documents`.<br>3. Drag and drop or browse to select a medical request PDF: `hospital_need_list.pdf`.<br>4. Click the **Upload & Process** button.<br>5. Observe the button displays "Processing..." and then the form resets. |
| **7. Expected Result** | The uploaded PDF is sent to the backend, parsed, and its status transitions to `PROCESSED`. A review list is populated, allowing the admin to approve and extract items. |
| **8. Actual Result** | The form resets back to the initial "No documents uploaded yet" state after showing a "Processing..." spinner. The document is not uploaded to the server, and the parsed list remains empty. |
| **9. Evidence** *(Visual Proof)* | * **Code Analysis**: [documents/page.tsx:L38-L46](file:///c:/Users/thari/Desktop/rebuild_man_project/frontend/app/documents/page.tsx#L38-L46) shows the mock implementation:<br>```typescript<br>const handleUpload = async (file: File) => {<br>  // In a real app, you'd call the API here<br>  console.log("Uploading file:", file.name);<br>  await new Promise((resolve) => setTimeout(resolve, 2000));<br>  const docs = await getDocuments();<br>  setDocuments(docs);<br>};<br>```<br>* **System Behavior**: The file upload dropzone goes back to empty without listing any documents. |

---

### Bug Report 2: Rejection Email Not Sent to Recipient Address

| Field Name | Description & Details |
| --- | --- |
| **1. Bug ID** | `BUG_002` |
| **2. Test Case ID** | [`TC_EMAIL_002`](file:///c:/Users/thari/Desktop/rebuild_man_project/docs/FUNCTIONAL_TEST_CASES.md#L180-L198) |
| **3. Bug Title** | Transactional rejection email not delivered to recipient mailbox upon organization admin request rejection |
| **4. Severity** | **Major** (Critical notification path fails to reach external users, leaving them uninformed about rejection reasons) |
| **5. Priority** | **Medium** (Can be verified through system admin console, but critical for user onboarding experience) |
| **6. Steps to Reproduce** | 1. Register an organization admin with the email address `communityhospitalprojectfct@gmail.com`.<br>2. Log in as System Admin (`sysadmin`).<br>3. Navigate to `/admin/approvals`.<br>4. Under the **Pending** tab, select the registration request.<br>5. Click the red cross **Reject** button, enter a rejection reason, and confirm.<br>6. Access the mailbox for `communityhospitalprojectfct@gmail.com`. |
| **7. Expected Result** | A transactional email with the subject `"Your ORG_ADMIN Registration Request Has Been Rejected – NeedTracker"` is sent and received in the inbox or spam folder of `communityhospitalprojectfct@gmail.com`. |
| **8. Actual Result** | No email is received. The System Admin console lists the user as "REJECTED" with the email modified to `rejected_0e1b8a00_communityhospitalprojectfct@gmail.com`, but the actual inbox remains empty. |
| **9. Evidence** *(Visual Proof)* | * **Database Status**: The user's email was previously changed to `rejected_0e1b8a00_communityhospitalprojectfct@gmail.com` under the Rejected list.<br>* **Code Analysis**: [views.py](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py) caught SMTP exceptions silently without logging or notifying caller.<br>* **Docker Environment**: [docker-compose.yml](file:///c:/Users/thari/Desktop/rebuild_man_project/docker-compose.yml) omitted `EMAIL_*` environment variables, defaulting container execution to console backend. |
| **10. Status & Resolution** | **Resolved**:<br>1. Removed database mutation logic in `AdminApprovalViewSet.reject`; original username and email are now preserved intact.<br>2. Forwarded all `EMAIL_*` variables in `docker-compose.yml` and added `EMAIL_TIMEOUT = 10` with proper `EMAIL_HOST_USER` fallback for `DEFAULT_FROM_EMAIL` in `settings.py`.<br>3. Replaced silent `print()` with structured `logger.error(..., exc_info=True)` and added `email_sent` delivery flag in the API response.<br>4. Sanitized existing database records via `cleanup_rejected_users` command. |

---

### Bug Report 3: Duplicate Username Auto-Appends Numeric Suffix Instead of Rejecting Registration

| Field Name | Description & Details |
| --- | --- |
| **1. Bug ID** | `BUG_003` |
| **2. Test Case ID** | [`ATC_REG_001`](file:///c:/Users/thari/Desktop/rebuild_man_project/docs/ALTERNATIVE_TEST_CASES.md#L101-L128) |
| **3. Bug Title** | System allows duplicate username registration by silently auto-appending numeric suffix (`_1`) instead of rejecting the request |
| **4. Severity** | **Major** (Violates unique identity integrity and security principles; users are assigned an altered username without consent or notification) |
| **5. Priority** | **High** (Directly affects user registration and authentication workflows) |
| **6. Steps to Reproduce** | 1. Ensure an active user exists with username `sadev_nhsl` and email `pasinduofficial6@gmail.com`.<br>2. Navigate to `http://rebuild-app.duckdns.org/login` (or `/login`) -> **Organization Register** tab.<br>3. Enter Organization Name: `Medilab Hospital` (or `Homagama Hospital`), Type: `CLINIC` (or `Hospital`).<br>4. Enter Admin First/Last Name: `Saman Perera` (or `Amal Perera`).<br>5. Enter the already-existing Admin Username: `sadev_nhsl`.<br>6. Enter Official Email: `pasinduofficial6@gmail.com` and Phone: `+94763102176`.<br>7. Enter Password and Confirm Password: `SecurePass@123`.<br>8. Check Terms of Service and click **Submit for Verification**.<br>9. Log in as System Admin (`sysadmin`) and navigate to `/admin/approvals` -> **Pending** tab. |
| **7. Expected Result** | The registration is rejected immediately. An error message displays informing that the username is already taken (e.g., `"A user with this username already exists."`), and no request is created in the database. |
| **8. Actual Result** | The registration submits successfully. In the System Admin Console under the **Pending** tab, the username is silently altered to `@sadev_nhsl_1` with no user warning. |
| **9. Evidence** *(Visual Proof)* | * **System Admin Approvals Screenshot**: Shows pending registration request for `Saman Perera` (`pasinduofficial6@gmail.com`) with username automatically altered to `@sadev_nhsl_1`.<br>* **Code Analysis**: [serializers.py:L132-L140](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/serializers.py#L132-L140) in `OrgAdminRegisterSerializer` executes a loop modifying the username instead of throwing `serializers.ValidationError({"username": "A user with that username already exists."})`:<br>```python<br>while User.objects.filter(username=username).exists():<br>    username = f"{base_username}_{counter}"<br>    counter += 1<br>attrs['username'] = username<br>``` |

