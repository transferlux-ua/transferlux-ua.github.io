# Integration test against the local worker (npx wrangler dev, port 8787)
$B = "http://127.0.0.1:8787"
$H = @{ "X-Telegram-Bot-Api-Secret-Token" = "localhook" }
function Tg($text) {
  $body = @{ update_id = 1; message = @{ message_id = 1; text = $text; chat = @{ id = 111; type = "private" }; from = @{ first_name = "Test" } } } | ConvertTo-Json -Depth 5
  Invoke-RestMethod "$B/tg" -Method Post -Headers $H -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
  Start-Sleep -Milliseconds 400
}
function Post($path, $obj) {
  try { Invoke-RestMethod "$B$path" -Method Post -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json))) }
  catch { "HTTP " + $_.Exception.Response.StatusCode.value__ + " " + $_.ErrorDetails.Message }
}

"--- webhook without secret must be refused"
try { Invoke-RestMethod "$B/tg" -Method Post -Body "{}" -ContentType "application/json" | Out-Null; "FAIL: accepted" } catch { "ok: " + $_.Exception.Response.StatusCode.value__ }

"--- non admin cannot add"; Tg "/add Київ Варшава 05.12 08:00 3"
"trips after non-admin add: " + ((Invoke-RestMethod "$B/api/trips/upcoming").trips.Count)

"--- register admin + add trip"; Tg "/start localtest123"; Tg "/add Київ Варшава 05.12 08:00 3"
$t = (Invoke-RestMethod "$B/api/trips?from=kyiv&to=warsaw").trips[0]
"trip: #$($t.id) $($t.from_id)->$($t.to_id) $($t.depart_date) $($t.depart_time) free=$($t.seats_free)/$($t.seats_total)"

"--- booking 2 seats"
$r1 = Post "/api/booking" @{ trip_id = $t.id; adults = 1; children = 1; name = "Іван"; phone = "+380 67 111 2233"; contact = "telegram"; idem = "idem-aaaa-0001"; lang = "uk" }
"r1: " + ($r1 | ConvertTo-Json -Compress)
"--- same idem again (double click) -> same id, no extra seats"
"r1b: " + ((Post "/api/booking" @{ trip_id = $t.id; adults = 1; children = 1; name = "Іван"; phone = "+380 67 111 2233"; idem = "idem-aaaa-0001" }) | ConvertTo-Json -Compress)
"--- same phone, new idem -> already_booked"
"r1c: " + (Post "/api/booking" @{ trip_id = $t.id; adults = 1; children = 0; name = "Іван"; phone = "+380 67 111 2233"; idem = "idem-aaaa-0002" })
"--- 2 seats more when only 1 left -> not_enough_seats"
"r2: " + (Post "/api/booking" @{ trip_id = $t.id; adults = 2; children = 0; name = "Олена"; phone = "+380 50 000 0000"; idem = "idem-bbbb-0001" })
"--- 1 seat -> ok, trip becomes full"
"r3: " + ((Post "/api/booking" @{ trip_id = $t.id; adults = 1; children = 0; name = "Петро"; phone = "+380 63 000 0000"; idem = "idem-cccc-0001" }) | ConvertTo-Json -Compress)
"free now: " + ((Invoke-RestMethod "$B/api/trips?from=kyiv&to=warsaw").trips[0].seats_free)
"--- validation"
"bad phone: " + (Post "/api/booking" @{ trip_id = $t.id; adults = 1; children = 0; name = "X Y"; phone = "12"; idem = "idem-dddd-0001" })
"honeypot: " + (Post "/api/booking" @{ trip_id = $t.id; adults = 1; children = 0; name = "Bot"; phone = "+380631112233"; idem = "idem-eeee-0001"; website = "spam" })
"--- individual request"
"ind: " + ((Post "/api/request" @{ from = "Прага"; to = "Київ"; date = "2026-12-20"; adults = 2; children = 1; name = "Марія"; phone = "+420 777 123 456"; contact = "whatsapp"; notes = "Велика валіза"; km = 1402.9; idem = "idem-ffff-0001"; lang = "uk" }) | ConvertTo-Json -Compress)
"--- bot: reject booking 1 releases seats"
$cb = @{ update_id = 2; callback_query = @{ id = "q1"; data = "br:$($r1.id)"; message = @{ message_id = 5; chat = @{ id = 111 } } } } | ConvertTo-Json -Depth 5
Invoke-RestMethod "$B/tg" -Method Post -Headers $H -ContentType "application/json" -Body $cb | Out-Null; Start-Sleep -Milliseconds 500
"free after reject: " + ((Invoke-RestMethod "$B/api/trips?from=kyiv&to=warsaw").trips[0].seats_free)
"--- bot: /seats and /cancel"
Tg "/seats $($t.id) 6"; "free after /seats 6: " + ((Invoke-RestMethod "$B/api/trips?from=kyiv&to=warsaw").trips[0].seats_free)
Tg "/cancel $($t.id)"; "trips after cancel: " + ((Invoke-RestMethod "$B/api/trips?from=kyiv&to=warsaw").trips.Count)
