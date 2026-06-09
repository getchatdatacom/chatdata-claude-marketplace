select
  week_start,
  landing_page,
  campaign_routing,
  sessions,
  qualified_signups,
  round(100.0 * qualified_signups / nullif(sessions, 0), 1) as signup_completion_pct
from analytics.mobile_paid_search_mix
where week_start >= current_date - interval '28 day'
order by week_start desc, sessions desc;
