select
  week_start,
  acquisition_type,
  signed_contracts
from analytics.contracts_wbr
where week_start >= current_date - interval '28 day'
  and acquisition_type in ('cash', 'cash_plus', 'ore', 'agent', 'builder')
order by week_start desc, acquisition_type;
