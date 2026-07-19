from django.core.management.base import BaseCommand
from django.db.models import Sum
from core.models import NeedItem, Donation

class Command(BaseCommand):
    help = "Recalculate quantity_received for all NeedItems based on FULFILLED donations."

    def handle(self, *args, **options):
        need_items = NeedItem.objects.all()
        updated_count = 0
        
        for item in need_items:
            fulfilled_sum = Donation.objects.filter(
                need_item=item,
                status='FULFILLED'
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            if item.quantity_received != fulfilled_sum:
                self.stdout.write(self.style.WARNING(
                    f"NeedItem ID {item.id} ({item.name}): updating quantity_received from {item.quantity_received} to {fulfilled_sum}"
                ))
                item.quantity_received = fulfilled_sum
                item.save(update_fields=['quantity_received'])
                updated_count += 1
                
        self.stdout.write(self.style.SUCCESS(
            f"Successfully checked all items and recalculated received quantity for {updated_count} NeedItems."
        ))
