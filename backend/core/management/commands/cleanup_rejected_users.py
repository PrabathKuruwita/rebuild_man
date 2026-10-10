import re
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = "Sanitize legacy mangled usernames and emails for rejected org admin users"

    def handle(self, *args, **options):
        users = User.objects.filter(approval_status='REJECTED')
        cleaned_count = 0
        
        for user in users:
            original_email = user.email
            original_username = user.username
            
            clean_email = re.sub(r'^rejected_[0-9a-fA-F]{8}_', '', user.email or '')
            clean_username = re.sub(r'_rejected_[0-9a-fA-F]{8}$', '', user.username or '')
            
            changed = False
            if clean_email != original_email:
                user.email = clean_email
                changed = True
                
            if clean_username != original_username:
                if User.objects.filter(username=clean_username).exclude(id=user.id).exists():
                    clean_username = f"{clean_username}_{user.id}"
                user.username = clean_username
                changed = True
                
            if changed:
                user.save()
                cleaned_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Cleaned user #{user.id}: '{original_username}' -> '{user.username}', '{original_email}' -> '{user.email}'"
                    )
                )
                
        self.stdout.write(self.style.SUCCESS(f"Finished. Successfully cleaned {cleaned_count} rejected user records."))
