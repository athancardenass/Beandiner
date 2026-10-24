# Safari time input overflow

On iPhone Safari, the Custom time input can extend beyond the checkout form.
Confirmed trigger: select a custom time, rotate to landscape, then return to portrait.
The fix applies `appearance: none` to the time input. The underlying root cause is unconfirmed.
