from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_EMAIL = "admin@needtracker.local"
DEFAULT_ADMIN_PASSWORD = "Admin@1234"


class Command(BaseCommand):
    help = "Create the default system admin account if it doesn't already exist."

    def handle(self, *args, **options):
        if User.objects.filter(username=DEFAULT_ADMIN_USERNAME).exists():
            self.stdout.write(self.style.WARNING(
                f"Admin account '{DEFAULT_ADMIN_USERNAME}' already exists. Skipping."
            ))
            return

        User.objects.create_superuser(
            username=DEFAULT_ADMIN_USERNAME,
            email=DEFAULT_ADMIN_EMAIL,
            password=DEFAULT_ADMIN_PASSWORD,
            role="ADMIN",
        )
        self.stdout.write(self.style.SUCCESS(
            f"Default admin account created successfully.\n"
            f"  Username: {DEFAULT_ADMIN_USERNAME}\n"
            f"  Password: {DEFAULT_ADMIN_PASSWORD}\n"
            f"  ⚠️  Change this password immediately in production!"
        ))
