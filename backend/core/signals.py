from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import Donation, NeedItem

@receiver(pre_save, sender=Donation)
def track_donation_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Donation.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_quantity = old_instance.quantity
            instance._old_need_item_id = old_instance.need_item_id
        except Donation.DoesNotExist:
            instance._old_status = None
            instance._old_quantity = None
            instance._old_need_item_id = None
    else:
        instance._old_status = None
        instance._old_quantity = None
        instance._old_need_item_id = None

@receiver(post_save, sender=Donation)
def update_need_item_on_save(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    old_quantity = getattr(instance, '_old_quantity', None)
    old_need_item_id = getattr(instance, '_old_need_item_id', None)
    
    new_status = instance.status
    new_quantity = instance.quantity
    new_need_item = instance.need_item
    
    # 1. If need_item changed:
    if old_need_item_id and old_need_item_id != instance.need_item_id:
        # Subtract from old need item if old status was FULFILLED
        if old_status == 'FULFILLED' and old_quantity is not None:
            try:
                old_need_item = NeedItem.objects.get(pk=old_need_item_id)
                old_need_item.quantity_received -= old_quantity
                old_need_item.save(update_fields=['quantity_received'])
            except NeedItem.DoesNotExist:
                pass
        # Add to new need item if new status is FULFILLED
        if new_status == 'FULFILLED' and new_need_item:
            new_need_item.quantity_received += new_quantity
            new_need_item.save(update_fields=['quantity_received'])
    else:
        # Need item did not change, normal updates
        if new_need_item:
            delta = 0
            if new_status == 'FULFILLED':
                if old_status == 'FULFILLED':
                    delta = new_quantity - (old_quantity if old_quantity is not None else 0)
                else:
                    delta = new_quantity
            else:
                if old_status == 'FULFILLED':
                    delta = -old_quantity
                    
            if delta != 0:
                new_need_item.quantity_received += delta
                new_need_item.save(update_fields=['quantity_received'])

@receiver(post_delete, sender=Donation)
def update_need_item_on_delete(sender, instance, **kwargs):
    need_item = instance.need_item
    if need_item and instance.status == 'FULFILLED':
        need_item.quantity_received -= instance.quantity
        need_item.save(update_fields=['quantity_received'])
