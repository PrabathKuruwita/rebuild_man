from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_EMAIL = "admin@rebuild.local"
DEFAULT_ADMIN_PASSWORD = "Admin@1234"


class Command(BaseCommand):
    help = """
    Create the default system admin account if it doesn't already exist.
    
    ⚠️  IMPORTANT NOTES:
    1. Always use this command to create admin accounts, NOT the registration endpoint
    2. If admin exists but has wrong role, this command will fix it
    3. Change the password immediately in production
    """

    def handle(self, *args, **options):
        admin_user = User.objects.filter(username=DEFAULT_ADMIN_USERNAME).first()
        
        # Check if admin exists with wrong role
        if admin_user:
            if admin_user.role != "ADMIN":
                self.stdout.write(self.style.WARNING(
                    f"⚠️  Admin account exists but has wrong role: {admin_user.role}"
                ))
                admin_user.role = "ADMIN"
                admin_user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"✅ Fixed admin role to ADMIN"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Admin account '{DEFAULT_ADMIN_USERNAME}' already exists."
                ))
            return

        # Create new admin
        User.objects.create_superuser(
            username=DEFAULT_ADMIN_USERNAME,
            email=DEFAULT_ADMIN_EMAIL,
            password=DEFAULT_ADMIN_PASSWORD,
            role="ADMIN",
        )
        self.stdout.write(self.style.SUCCESS(
            f"✅ Default admin account created successfully!\n"
            f"   Username: {DEFAULT_ADMIN_USERNAME}\n"
            f"   Email: {DEFAULT_ADMIN_EMAIL}\n"
            f"   Password: {DEFAULT_ADMIN_PASSWORD}\n"
            f"   ⚠️  Change this password immediately in production!"
        ))
