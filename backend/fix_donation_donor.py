import django
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import Donation, User

try:
    ravindu_user = User.objects.get(username="Ravindu")
    d = Donation.objects.get(id=8)
    
    old_donor = d.donor.username if d.donor else None
    print(f"Before: Donation ID 8 was made by {old_donor}")
    
    # Update the donor to Ravindu
    d.donor = ravindu_user
    d.save()
    
    print(f"After: Donation ID 8 is now credited to {d.donor.username}")
    
    # Print new donation count for Ravindu
    count = ravindu_user.donations.filter(status__in=['CONFIRMED', 'FULFILLED']).count()
    print(f"New TOTAL DONATIONS count for Ravindu: {count}")
    
except Exception as e:
    print(f"Error: {e}")
