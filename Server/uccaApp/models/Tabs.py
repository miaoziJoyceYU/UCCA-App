from django.db import models
from uccaApp.models import Constants


class Tabs(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, choices=Constants.TAB_NAMES)

    def __unicode__(self):
        return self.name

    class Meta:
        db_table="tabs"
