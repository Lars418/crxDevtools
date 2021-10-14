# Network Enhancement Suite (NES)

A browser extension enhancing the `network` tab.

## Feature request
Email [extension-support@koelker.dev](mailto:extension-support@koelker.dev?subject=NES+feature+request).


## FAQ


### Why are requests not shown when they're pending?
The underlying extension API only communicates requests, when they're finished.

### Why can't I interact with the `initiator` values?
The underlying extension API doesn't communicate, what file initiated the request.
Beside that it is not possible to open the `Sources` panel either. The value
`parser` refers to requests, that have been initiated by those "unknown" files.

### Why is the error message different to the original `Network` panel?
Again, the extension API doesn't communicate, if a request failed. This
information is "extracted" from the status code an an `error` flag (which
is anything but accurate).

### Why did you add an extra tab?
You guessed it ... extension API. You can't add any new features to existing
panels (beside the `Elements` one).

### Feature xyz is missing.
This extension is WIP. Don't except every feature of the original tab to be
available. Some features are technically not possible, others just have not
been implemented yet.


https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=lars.koelker@gmx.de&lc=US&no_note=0&item_name=Buy+me+a+coffee!+:)+☕️&cn=&curency_code=EUR&bn=PP-DonationsBF:btn_donateCC_LG.gif:NonHosted
