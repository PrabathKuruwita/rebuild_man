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
| **9. Evidence** *(Visual Proof)* | * **Database Status**: The user's email is successfully changed to `rejected_0e1b8a00_communityhospitalprojectfct@gmail.com` under the Rejected list.<br>* **Code Analysis**: [views.py:L1051-L1053](file:///c:/Users/thari/Desktop/rebuild_man_project/backend/core/views.py#L1051-L1053) catches the SMTP exceptions silently:<br>```python<br>except Exception as e:<br>    print(f"Failed to send rejection email to {user_email}: {str(e)}")<br>``` |
