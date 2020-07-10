import datetime 
from dateutil.relativedelta import relativedelta


maxd =  datetime.datetime.now()
mind = (maxd - relativedelta(months=100))
maxd = maxd.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
mind = mind.strftime('%Y-%m-%dT%H:%M:%S.%fZ')

print(maxd, mind, type(maxd), type(mind))