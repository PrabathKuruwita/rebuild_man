import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def check_email_configuration():
    print("=== Django Email Configuration Check ===")
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {'[SET]' if settings.EMAIL_HOST_USER else '[NOT SET]'}")
    print(f"EMAIL_HOST_PASSWORD: {'[SET]' if settings.EMAIL_HOST_PASSWORD else '[NOT SET]'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print("========================================")

    if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
        print("\n[NOTE] Currently configured to use the CONSOLE email backend.")
        print("Emails will NOT be sent to SMTP. Instead, they will be printed in the console stdout.")
        print("This is normal for local development, but in production, you MUST use the SMTP backend.")
    elif settings.EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
        print("\n[INFO] Configured to use the SMTP email backend.")
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            print("[WARNING] SMTP backend is enabled, but EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is empty!")
            print("Please configure valid credentials to send emails successfully.")
        else:
            print("[SUCCESS] Credentials and SMTP backend are configured.")
            print("Attempting to send a test email...")
            
            from django.core.mail import send_mail
            recipient = input("Enter a recipient email address to send a test email to: ").strip()
            if recipient:
                try:
                    send_mail(
                        subject="NeedTracker Email Service Test",
                        message="Congratulations! Your deployed email service configuration is working correctly.",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[recipient],
                        fail_silently=False,
                    )
                    print(f"[SUCCESS] Test email sent successfully to {recipient}!")
                except Exception as e:
                    print(f"[ERROR] Failed to send email: {e}")
            else:
                print("Skipped sending test email.")

if __name__ == "__main__":
    check_email_configuration()
