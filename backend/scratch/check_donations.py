
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Donation, Organization, User

user = User.objects.get(username='Pasindu_Promodaya')
print(f"User: {user.username}, Role: {user.role}")

org = user.managed_org
if not org:
    # Try requested_organization
    org = user.requested_organization

print(f"Organization: {org.name if org else 'None'}, ID: {org.id if org else 'None'}")

if org:
    needs = org.sections.all().values_list('needs__id', flat=True)
    donations = Donation.objects.filter(need_item_id__in=needs)
    confirmed = donations.filter(status='CONFIRMED')
    print(f"Total donations for org: {donations.count()}")
    print(f"Confirmed donations for org: {confirmed.count()}")
    for d in confirmed:
        print(f"  - Donation {d.id}: Status={d.status}, Need={d.need_item.name}, Quantity={d.quantity}")
else:
    print("No organization found for user.")
