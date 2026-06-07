import django
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from core.models import Donation, User

for d in Donation.objects.all():
    donor_username = d.donor.username if d.donor else None
    print(f"ID: {d.id}, Status: {d.status}, Type: {d.donor_type}, Donor User: {donor_username}, Gov Officer: {d.government_officer_name}, Private Name: {d.donor_name}")
