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
    # 1. Update Donor side notifications
    notifications_donor = Notification.objects.filter(action_url="/profile")
    print(f"Found {notifications_donor.count()} donor notifications with action_url='/profile'")
    
    updated_donor_count = 0
    for n in notifications_donor:
        donor = n.recipient
        item_name_match = re.search(r"'(.*?)'", n.message)
        if not item_name_match:
            continue
        item_name = item_name_match.group(1)
        
        donations = Donation.objects.filter(donor=donor, need_item__name=item_name)
        if n.notification_type == 'PLEDGE_CONFIRMED':
            donations = donations.filter(status__in=['CONFIRMED', 'FULFILLED'])
        elif n.notification_type == 'PLEDGE_CANCELLED':
            donations = donations.filter(status='CANCELLED')
        elif n.notification_type == 'PLEDGE_RECEIVED':
            donations = donations.filter(status='FULFILLED')
            
        if donations.exists():
            best_donation = None
            min_diff = None
            for d in donations:
                diff = abs((n.created_at - d.created_at).total_seconds()) if n.created_at and d.created_at else 0
                if min_diff is None or diff < min_diff:
                    min_diff = diff
                    best_donation = d
            
            if best_donation:
                n.action_url = f"/?donation={best_donation.id}"
                n.save()
                updated_donor_count += 1
                print(f"Updated Donor Notification {n.id} to action_url='/?donation={best_donation.id}' (Item: {item_name})")

    # 2. Update Org Admin side notifications
    notifications_org = Notification.objects.filter(action_url__startswith="/admin/donations?section=")
    print(f"Found {notifications_org.count()} org admin notifications with action_url starting with '/admin/donations?section='")
    
    updated_org_count = 0
    for n in notifications_org:
        admin_user = n.recipient
        
        # Extract item name between single quotes if present
        item_name_match = re.search(r"'(.*?)'", n.message)
        if not item_name_match:
            continue
        item_name = item_name_match.group(1)
        
        # Find donations matching the organization of this admin and item name
        # Admin must be associated with the organization
        organization = admin_user.organization
        if not organization:
            continue
            
        donations = Donation.objects.filter(
            need_item__section__organization=organization,
            need_item__name=item_name
        )
        
        if n.notification_type == 'PLEDGE_CREATED':
            donations = donations.filter(status__in=['PENDING', 'CONFIRMED', 'FULFILLED'])
        elif n.notification_type == 'PLEDGE_CANCELLED':
            donations = donations.filter(status='CANCELLED')
            
        if donations.exists():
            best_donation = None
            min_diff = None
            for d in donations:
                diff = abs((n.created_at - d.created_at).total_seconds()) if n.created_at and d.created_at else 0
                if min_diff is None or diff < min_diff:
                    min_diff = diff
                    best_donation = d
            
            if best_donation:
                n.action_url = f"/admin/donations?donation={best_donation.id}"
                n.save()
                updated_org_count += 1
                print(f"Updated Org Admin Notification {n.id} to action_url='/admin/donations?donation={best_donation.id}' (Item: {item_name})")
                
    print(f"Successfully updated {updated_donor_count} donor notifications and {updated_org_count} org admin notifications.")

if __name__ == "__main__":
    run()
