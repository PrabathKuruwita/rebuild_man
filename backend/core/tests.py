from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Organization, Section, NeedItem, Donation
from unittest.mock import patch, MagicMock

User = get_user_model()

class DonationSplitTests(APITestCase):
    def setUp(self):
        # Create an org admin user
        self.org_admin = User.objects.create_user(
            username="orgadmin",
            email="orgadmin@example.com",
            password="testpassword123",
            role="ORG_ADMIN"
        )
        
        # Create an organization and associate the admin
        self.org = Organization.objects.create(
            name="Test General Hospital",
            registration_number="REG12345",
            address="123 Hospital Road",
            district="colombo",
            org_type="HOSPITAL"
        )
        self.org_admin.organization = self.org
        self.org_admin.save()
        
        # Create a section
        self.section = Section.objects.create(
            organization=self.org,
            name="Emergency Ward"
        )
        
        # Create a need item (50 units required, 30 units already received)
        self.need_item = NeedItem.objects.create(
            section=self.section,
            name="Critical Saline Bottles",
            priority="CRITICAL",
            quantity_required=50,
            quantity_received=30,
            unit="UNIT"
        )
        
        # Force authentication of the client
        self.client.force_authenticate(user=self.org_admin)

    def test_confirm_full_quantity_without_split(self):
        """
        Confirming the full pledge of 50 units does not increase received count immediately,
        but marking it received increases received count.
        """
        donation = Donation.objects.create(
            need_item=self.need_item,
            quantity=50,
            status='PENDING',
            donor_type='private',
            donor_name='John Doe',
            donor_email='john@example.com'
        )
        
        # Confirm donation
        url_confirm = reverse('donation-confirm', kwargs={'pk': donation.id})
        response = self.client.post(url_confirm, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh and check that received quantity is still 30 (not updated on confirm)
        donation.refresh_from_db()
        self.need_item.refresh_from_db()
        self.assertEqual(self.need_item.quantity_received, 30)
        self.assertEqual(donation.status, 'CONFIRMED')
        
        # Now mark as received
        url_receive = reverse('donation-receive', kwargs={'pk': donation.id})
        response = self.client.post(url_receive, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh and check that received quantity has increased to 30 + 50 = 80
        donation.refresh_from_db()
        self.need_item.refresh_from_db()
        self.assertEqual(self.need_item.quantity_received, 80)
        self.assertEqual(donation.status, 'FULFILLED')
        
        # No extra donations should have been created (total count is 1)
        self.assertEqual(Donation.objects.count(), 1)

    def test_confirm_partial_quantity_with_split(self):
        """
        Confirming partial quantity (remaining needed = 20 units) updates the original record to 20 units,
        and splits the remaining 30 units into a CANCELLED surplus record.
        Marking it received then increases need_item.quantity_received by 20.
        """
        donation = Donation.objects.create(
            need_item=self.need_item,
            quantity=50,
            status='PENDING',
            donor_type='private',
            donor_name='John Doe',
            donor_email='john@example.com',
            message="Glad to help!"
        )
        
        url_confirm = reverse('donation-confirm', kwargs={'pk': donation.id})
        # Explicitly confirm only 20 units (the remaining needed amount)
        response = self.client.post(url_confirm, {'confirmed_quantity': 20}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        donation.refresh_from_db()
        self.need_item.refresh_from_db()
        
        # The original donation quantity should be adjusted to 20
        self.assertEqual(donation.quantity, 20)
        self.assertEqual(donation.status, 'CONFIRMED') 
        # Received count should still be 30
        self.assertEqual(self.need_item.quantity_received, 30)
        
        # Mark the adjusted donation as received
        url_receive = reverse('donation-receive', kwargs={'pk': donation.id})
        response = self.client.post(url_receive, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        donation.refresh_from_db()
        self.need_item.refresh_from_db()
        # The received count should now be 30 + 20 = 50
        self.assertEqual(self.need_item.quantity_received, 50)
        self.assertEqual(donation.status, 'FULFILLED')
        
        # There should now be 2 donations in the database (original + surplus)
        self.assertEqual(Donation.objects.count(), 2)
        
        # Retrieve the split/surplus donation
        surplus_donation = Donation.objects.exclude(id=donation.id).first()
        self.assertIsNotNone(surplus_donation)
        self.assertEqual(surplus_donation.quantity, 30)
        self.assertEqual(surplus_donation.status, 'CANCELLED')
        self.assertEqual(surplus_donation.cancellation_reason, 'Surplus quantity exceeding the required need.')
        self.assertEqual(surplus_donation.cancelled_by, self.org_admin)
        self.assertIsNotNone(surplus_donation.cancelled_at)
        self.assertEqual(surplus_donation.donor_name, 'John Doe')
        self.assertEqual(surplus_donation.donor_email, 'john@example.com')
        self.assertEqual(surplus_donation.message, "Glad to help!")

    def test_cancel_donation_sets_cancelled_at(self):
        """
        Cancelling a donation via API sets the cancelled_at timestamp.
        """
        donation = Donation.objects.create(
            need_item=self.need_item,
            quantity=10,
            status='PENDING',
            donor_type='private',
            donor_name='Bob Smith'
        )
        
        url = reverse('donation-cancel', kwargs={'pk': donation.id})
        response = self.client.post(url, {'reason': 'Incorrect item type'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        donation.refresh_from_db()
        self.assertEqual(donation.status, 'CANCELLED')
        self.assertEqual(donation.cancellation_reason, 'Incorrect item type')
        self.assertIsNotNone(donation.cancelled_at)

    def test_cancel_donation_sends_email_with_critical_needs(self):
        """
        Cancelling a donation sends a cancellation email containing a list of top unfulfilled needs.
        """
        from django.core import mail
        
        # Clear outbox
        mail.outbox = []
        
        donation = Donation.objects.create(
            need_item=self.need_item,
            quantity=10,
            status='PENDING',
            donor_type='private',
            donor_name='Bob Smith',
            donor_email='bob@example.com'
        )
        
        # Trigger cancellation
        url = reverse('donation-cancel', kwargs={'pk': donation.id})
        response = self.client.post(url, {'reason': 'Incorrect item type'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify email is sent
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertIn("Donation Cancelled", email.subject)
        
        # Check that the email body contains critical needs from the organization
        self.assertIn("Here are some of the most important needs at Test General Hospital that still require support:", email.body)
        self.assertIn(self.need_item.name, email.body)

    def test_receive_donation_sends_thank_you_email(self):
        """
        Marking a confirmed donation as physically received changes status to FULFILLED.
        """
        donation = Donation.objects.create(
            need_item=self.need_item,
            quantity=20,
            status='CONFIRMED',
            donor_type='private',
            donor_name='Sarah Connor',
            donor_email='sarah@example.com'
        )
        
        url = reverse('donation-receive', kwargs={'pk': donation.id})
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        donation.refresh_from_db()
        self.assertEqual(donation.status, 'FULFILLED')
        self.assertEqual(donation.received_by, self.org_admin)

    def test_donor_cancel_donation_sends_email_with_cancelled_by_you(self):
        """
        When a donor user cancels their own pledge, the cancellation email
        body contains 'has been cancelled by you'.
        """
        from django.core import mail
        
        # Clear outbox
        mail.outbox = []
        
        # Create a donor user
        donor_user = User.objects.create_user(
            username="donoruser",
            email="donor@example.com",
            password="testpassword123",
            role="DONOR"
        )
        
        donation = Donation.objects.create(
            donor=donor_user,
            need_item=self.need_item,
            quantity=5,
            status='CONFIRMED',
            donor_type='private',
            donor_name='Donor User',
            donor_email='donor@example.com'
        )
        
        # Authenticate as the donor
        self.client.force_authenticate(user=donor_user)
        
        # Trigger cancellation
        url = reverse('donation-cancel', kwargs={'pk': donation.id})
        response = self.client.post(url, {'reason': 'Change of mind'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify email is sent
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertIn("Donation Cancelled", email.subject)
        
        # Check that the email body contains "has been cancelled by you."
        self.assertIn("has been cancelled by you.", email.body)

    def test_send_delivery_reminders_command(self):
        """
        The send_delivery_reminders management command correctly selects only
        confirmed donations due in exactly 3 days and creates PLEDGE_REMINDER notifications.
        """
        from django.core.management import call_command
        from django.utils import timezone
        from datetime import timedelta
        from core.models import Notification
        
        # Clear existing notifications
        Notification.objects.all().delete()
        
        # Create a donor user
        donor_user = User.objects.create_user(
            username="reminderdonor",
            email="donor_reminder@example.com",
            password="testpassword123",
            role="DONOR"
        )
        
        today = timezone.localdate()
        date_3_days_away = today + timedelta(days=3)
        date_4_days_away = today + timedelta(days=4)
        date_2_days_away = today + timedelta(days=2)
        
        # 1. Matching donation (CONFIRMED, donor is present, estimated_delivery_date is 3 days away)
        matching_donation = Donation.objects.create(
            donor=donor_user,
            need_item=self.need_item,
            quantity=10,
            status='CONFIRMED',
            estimated_delivery_date=date_3_days_away
        )
        
        # 2. Non-matching donation - wrong status (PENDING, 3 days away)
        pending_donation = Donation.objects.create(
            donor=donor_user,
            need_item=self.need_item,
            quantity=10,
            status='PENDING',
            estimated_delivery_date=date_3_days_away
        )
        
        # 3. Non-matching donation - wrong date (CONFIRMED, 4 days away)
        far_donation = Donation.objects.create(
            donor=donor_user,
            need_item=self.need_item,
            quantity=10,
            status='CONFIRMED',
            estimated_delivery_date=date_4_days_away
        )
        
        # 4. Non-matching donation - wrong date (CONFIRMED, 2 days away)
        near_donation = Donation.objects.create(
            donor=donor_user,
            need_item=self.need_item,
            quantity=10,
            status='CONFIRMED',
            estimated_delivery_date=date_2_days_away
        )
        
        # 5. Non-matching donation - no donor (CONFIRMED, 3 days away, donor is null)
        anonymous_donation = Donation.objects.create(
            donor=None,
            need_item=self.need_item,
            quantity=10,
            status='CONFIRMED',
            estimated_delivery_date=date_3_days_away
        )
        
        # Run command
        call_command('send_delivery_reminders')
        
        # Check notifications created
        reminders = Notification.objects.filter(notification_type='PLEDGE_REMINDER')
        self.assertEqual(reminders.count(), 1)
        
        reminder = reminders.first()
        self.assertEqual(reminder.recipient, donor_user)
        self.assertIn("scheduled for delivery on", reminder.message)
        self.assertIn("(in 3 days)", reminder.message)
        self.assertIn("the pledge will be cancelled", reminder.message)


class OrganizationGeocodingTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpassword"
        )
        self.client.force_authenticate(user=self.admin)

    @patch('urllib.request.urlopen')
    def test_organization_save_geocodes_automatically(self, mock_urlopen):
        """
        An organization created without coordinates should be geocoded.
        """
        mock_response = MagicMock()
        mock_response.read.return_value = b'[{"lat": "6.9271", "lon": "79.8612"}]'
        mock_urlopen.return_value = mock_response

        org = Organization.objects.create(
            name="Mocked Hospital Colombo",
            registration_number="REG-MCK-01",
            address="123 Hospital Road",
            district="Colombo"
        )

        self.assertEqual(org.latitude, 6.9271)
        self.assertEqual(org.longitude, 79.8612)

    @patch('urllib.request.urlopen')
    def test_organization_geocode_on_address_change(self, mock_urlopen):
        """
        An organization updated with a new address should have its coordinates re-geocoded.
        """
        mock_response = MagicMock()
        mock_response.read.return_value = b'[{"lat": "6.9271", "lon": "79.8612"}]'
        mock_urlopen.return_value = mock_response

        org = Organization.objects.create(
            name="Mocked Hospital Colombo",
            registration_number="REG-MCK-02",
            address="123 Hospital Road",
            district="Colombo"
        )
        self.assertEqual(org.latitude, 6.9271)

        # Update address
        mock_response_new = MagicMock()
        mock_response_new.read.return_value = b'[{"lat": "7.2906", "lon": "80.6337"}]'
        mock_urlopen.return_value = mock_response_new

        org.address = "456 Kandy Road"
        org.save()

        self.assertEqual(org.latitude, 7.2906)
        self.assertEqual(org.longitude, 80.6337)

    @patch('urllib.request.urlopen')
    def test_organization_custom_coordinates_not_overwritten(self, mock_urlopen):
        """
        Custom coordinates should not be overridden by geocoder.
        """
        org = Organization.objects.create(
            name="Mocked Hospital Colombo",
            registration_number="REG-MCK-03",
            address="123 Hospital Road",
            district="Colombo",
            latitude=6.1234,
            longitude=79.5678
        )
        self.assertEqual(org.latitude, 6.1234)
        self.assertEqual(org.longitude, 79.5678)
        mock_urlopen.assert_not_called()

        # Update address but provide explicit coordinates
        org.address = "Changed Address"
        org.latitude = 6.4321
        org.longitude = 79.8765
        org.save()

        self.assertEqual(org.latitude, 6.4321)
        self.assertEqual(org.longitude, 79.8765)
        mock_urlopen.assert_not_called()

    @patch('urllib.request.urlopen')
    def test_organization_address_change_triggers_geocode(self, mock_urlopen):
        """
        If address changes and coordinates are NOT changed manually, geocoding runs.
        """
        org = Organization.objects.create(
            name="Mocked Hospital Colombo",
            registration_number="REG-MCK-04",
            address="123 Hospital Road",
            district="Colombo",
            latitude=6.1234,
            longitude=79.5678
        )

        mock_response = MagicMock()
        mock_response.read.return_value = b'[{"lat": "7.2906", "lon": "80.6337"}]'
        mock_urlopen.return_value = mock_response

        # Change address only
        org.address = "456 Kandy Road"
        org.save()

        self.assertEqual(org.latitude, 7.2906)
        self.assertEqual(org.longitude, 80.6337)
        self.assertTrue(mock_urlopen.called)


class AdminApprovalSerializerTests(APITestCase):
    def setUp(self):
        self.org = Organization.objects.create(
            name="Test Serializer Hospital",
            registration_number="REG-SER-01",
            address="123 Serializer St",
            district="Colombo"
        )
        # Sys admin
        self.sys_admin = User.objects.create_user(
            username="sysadmin",
            email="sysadmin@example.com",
            password="password",
            role="ADMIN"
        )
        # Org admin with name
        self.org_admin_with_name = User.objects.create_user(
            username="orgadmin_name",
            email="name@example.com",
            password="password",
            role="ORG_ADMIN",
            first_name="Pasindu",
            last_name="Promodaya",
            organization=self.org
        )
        # Org admin without name
        self.org_admin_no_name = User.objects.create_user(
            username="orgadmin_noname",
            email="noname@example.com",
            password="password",
            role="ORG_ADMIN",
            organization=self.org
        )

    def test_decided_by_sys_admin(self):
        user = User.objects.create_user(
            username="new_user_1",
            email="new1@example.com",
            password="password",
            role="ORG_ADMIN",
            approval_decided_by=self.sys_admin
        )
        from core.serializers import AdminApprovalSerializer
        serializer = AdminApprovalSerializer(user)
        self.assertEqual(serializer.data['approval_decided_by_username'], "System Admin")

    def test_decided_by_org_admin_with_name(self):
        user = User.objects.create_user(
            username="new_user_2",
            email="new2@example.com",
            password="password",
            role="ORG_ADMIN",
            approval_decided_by=self.org_admin_with_name
        )
        from core.serializers import AdminApprovalSerializer
        serializer = AdminApprovalSerializer(user)
        self.assertEqual(serializer.data['approval_decided_by_username'], "Org Admin (Pasindu Promodaya)")

    def test_decided_by_org_admin_without_name(self):
        user = User.objects.create_user(
            username="new_user_3",
            email="new3@example.com",
            password="password",
            role="ORG_ADMIN",
            approval_decided_by=self.org_admin_no_name
        )
        from core.serializers import AdminApprovalSerializer
        serializer = AdminApprovalSerializer(user)
        self.assertEqual(serializer.data['approval_decided_by_username'], "Org Admin (orgadmin_noname)")

    def test_fallback_to_oldest_org_admin(self):
        # approval_decided_by is None, but user belongs to an organization that has orgadmin_name as oldest
        user = User.objects.create_user(
            username="new_user_4",
            email="new4@example.com",
            password="password",
            role="ORG_ADMIN",
            organization=self.org,
            approval_decided_by=None
        )
        from core.serializers import AdminApprovalSerializer
        serializer = AdminApprovalSerializer(user)
        self.assertEqual(serializer.data['approval_decided_by_username'], "Org Admin (Pasindu Promodaya)")


