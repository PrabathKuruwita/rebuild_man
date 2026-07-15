from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Donation, Notification

class Command(BaseCommand):
    help = "Sends platform notifications to donors whose estimated delivery date is in 3 days."

    def handle(self, *args, **options):
        target_date = timezone.localdate() + timedelta(days=3)
        
        # Query confirmed donations scheduled for delivery in exactly 3 days
        upcoming_donations = Donation.objects.filter(
            status='CONFIRMED',
            donor__isnull=False,
            estimated_delivery_date=target_date
        )
        
        self.stdout.write(f"Found {upcoming_donations.count()} pledges due in 3 days ({target_date}).")
        
        count = 0
        for donation in upcoming_donations:
            need_item = donation.need_item
            section = need_item.section
            org = section.organization
            
            title = "Upcoming Pledge Delivery Reminder"
            message = (
                f"Reminder: Your donation pledge of {donation.quantity} {need_item.unit}(s) of '{need_item.name}' "
                f"for {section.name} of {org.name} is scheduled for delivery on {donation.estimated_delivery_date} (in 3 days). "
                f"Please note that if you are unable to deliver the pledge within the estimated timeframe, the pledge will be cancelled."
            )
            
            Notification.objects.create(
                recipient=donation.donor,
                notification_type='PLEDGE_REMINDER',
                title=title,
                message=message,
                action_url=f"/?donation={donation.id}"
            )
            count += 1
            self.stdout.write(f"Created reminder notification for donor: {donation.donor.username} (Donation ID: {donation.id})")
            
        self.stdout.write(self.style.SUCCESS(f"Successfully sent {count} reminder notifications."))
