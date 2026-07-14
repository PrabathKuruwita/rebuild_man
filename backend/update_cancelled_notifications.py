import re
import os
import sys
import django

# Add the backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Notification, Donation

def run():
    # Find all PLEDGE_CANCELLED notifications
    notifications = Notification.objects.filter(notification_type='PLEDGE_CANCELLED')
    print(f"Found {notifications.count()} cancellation notifications.")
    
    updated_count = 0
    for n in notifications:
        # Check if the notification is for an Org Admin (starts with Donor username...)
        # and doesn't already contain "Reason:" in message
        if n.recipient.role == 'ORG_ADMIN' and "Reason:" not in n.message:
            # Extract item name between single quotes
            item_name_match = re.search(r"'(.*?)'", n.message)
            if not item_name_match:
                continue
            item_name = item_name_match.group(1)
            
            # Find the corresponding donation (status CANCELLED)
            organization = n.recipient.organization
            if not organization:
                continue
                
            donations = Donation.objects.filter(
                need_item__section__organization=organization,
                need_item__name=item_name,
                status='CANCELLED'
            )
            
            if donations.exists():
                # Get the donation created closest to the notification
                best_donation = None
                min_diff = None
                for d in donations:
                    diff = abs((n.created_at - d.created_at).total_seconds()) if n.created_at and d.created_at else 0
                    if min_diff is None or diff < min_diff:
                        min_diff = diff
                        best_donation = d
                
                if best_donation and best_donation.cancellation_reason:
                    reason = best_donation.cancellation_reason
                    # Strip any trailing period and append
                    n.message = n.message.rstrip('.') + f". Reason: {reason}"
                    n.save()
                    updated_count += 1
                    print(f"Updated Notification {n.id} to: '{n.message}'")
                    
    print(f"Successfully updated {updated_count} cancellation notifications.")

if __name__ == "__main__":
    run()
