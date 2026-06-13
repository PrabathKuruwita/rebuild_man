from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Organization, Section, NeedItem, Donation

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
        Confirming the full pledge of 50 units increases received count and does not create surplus.
        """
        donation = Donation.objects.create(
            need_item=self.need_item,
            quantity=50,
            status='PENDING',
            donor_type='private',
            donor_name='John Doe',
            donor_email='john@example.com'
        )
        
        url = reverse('donation-confirm', kwargs={'pk': donation.id})
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        donation.refresh_from_db()
        self.need_item.refresh_from_db()
        
        # The received quantity should now be 30 + 50 = 80
        self.assertEqual(self.need_item.quantity_received, 80)
        
        # Since we removed automatic fulfillment, status should be CONFIRMED
        self.assertEqual(donation.status, 'CONFIRMED')
        
        # No extra donations should have been created (total count is 1)
        self.assertEqual(Donation.objects.count(), 1)

    def test_confirm_partial_quantity_with_split(self):
        """
        Confirming partial quantity (remaining needed = 20 units) updates the original record to 20 units,
        marks it as confirmed/fulfilled, and splits the remaining 30 units into a CANCELLED surplus record.
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
        
        url = reverse('donation-confirm', kwargs={'pk': donation.id})
        # Explicitly confirm only 20 units (the remaining needed amount)
        response = self.client.post(url, {'confirmed_quantity': 20}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh from database
        donation.refresh_from_db()
        self.need_item.refresh_from_db()
        
        # The original donation quantity should be adjusted to 20
        self.assertEqual(donation.quantity, 20)
        self.assertEqual(donation.status, 'CONFIRMED') # Remains CONFIRMED until physically received
        self.assertEqual(self.need_item.quantity_received, 50)
        
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
