# Local edit of the team photo: replaces the small chest logos with a tiny "TL" mark.
# Only pixels inside the listed boxes are touched (faces, people, cars, background stay original).
param([string]$In = "C:\Users\pejsa\transferlux\img\team-drivers.jpg", [string]$Out = "")
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
if (-not $Out) { $Out = Join-Path $root "public\img\team-drivers.jpg" }
# x, y, w, h of each chest logo in the original 1099x1280 photo
$boxes = @(
  @(88, 637, 28, 22), @(221, 611, 18, 16), @(328, 649, 18, 16), @(444, 622, 18, 16),
  @(646, 615, 15, 17), @(722, 645, 14, 16), @(905, 637, 16, 16), @(1017, 636, 16, 16)
)
$src = [System.Drawing.Bitmap]::FromFile($In)
$bmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height
$g = [System.Drawing.Graphics]::FromImage($bmp); $g.DrawImage($src, 0, 0, $src.Width, $src.Height); $g.Dispose(); $src.Dispose()

function Lum($c) { 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B }
$rnd = New-Object System.Random 7
foreach ($b in $boxes) {
  $x0 = $b[0]; $y0 = $b[1]; $w = $b[2]; $h = $b[3]
  # fabric colour = median of a 3 px ring around the box
  $ring = New-Object System.Collections.Generic.List[object]
  for ($y = $y0 - 4; $y -lt $y0 + $h + 4; $y++) { for ($x = $x0 - 4; $x -lt $x0 + $w + 4; $x++) {
    if ($x -ge $x0 - 1 -and $x -lt $x0 + $w + 1 -and $y -ge $y0 - 1 -and $y -lt $y0 + $h + 1) { continue }
    $ring.Add($bmp.GetPixel($x, $y)) } }
  $sorted = $ring | Sort-Object { Lum $_ }
  $med = $sorted[[int]($sorted.Count / 2)]
  $q1 = $sorted[[int]($sorted.Count * 0.25)]; $q3 = $sorted[[int]($sorted.Count * 0.75)]
  $thr = (Lum $med) + 12
  # 1) mask logo pixels (brighter or yellowish than the fabric), grown by 1 px
  $mask = New-Object 'bool[,]' $w, $h
  for ($y = 0; $y -lt $h; $y++) { for ($x = 0; $x -lt $w; $x++) {
    $c = $bmp.GetPixel($x0 + $x, $y0 + $y)
    if ((Lum $c) -gt $thr -or ($c.R - $c.B) -gt 20) {
      for ($dy = -1; $dy -le 1; $dy++) { for ($dx = -1; $dx -le 1; $dx++) {
        $mx = $x + $dx; $my = $y + $dy; if ($mx -ge 0 -and $my -ge 0 -and $mx -lt $w -and $my -lt $h) { $mask[$mx, $my] = $true } } }
    } } }
  # 2) onion-peel inpainting: each masked pixel becomes the mean of its known neighbours
  $left = 1
  while ($left -gt 0) {
    $left = 0; $fill = @()
    for ($y = 0; $y -lt $h; $y++) { for ($x = 0; $x -lt $w; $x++) {
      if (-not $mask[$x, $y]) { continue }
      $r = 0; $gr = 0; $bl = 0; $n = 0
      for ($dy = -1; $dy -le 1; $dy++) { for ($dx = -1; $dx -le 1; $dx++) {
        if ($dx -eq 0 -and $dy -eq 0) { continue }
        $mx = $x + $dx; $my = $y + $dy
        $known = ($mx -lt 0 -or $my -lt 0 -or $mx -ge $w -or $my -ge $h) -or (-not $mask[$mx, $my])
        if ($known) { $c = $bmp.GetPixel($x0 + $mx, $y0 + $my); $r += $c.R; $gr += $c.G; $bl += $c.B; $n++ } } }
      if ($n -ge 3) { $fill += ,@($x, $y, [int]($r / $n), [int]($gr / $n), [int]($bl / $n)) } else { $left++ }
    } }
    foreach ($f in $fill) {
      $j = $rnd.Next(-2, 3)
      $bmp.SetPixel($x0 + $f[0], $y0 + $f[1], [System.Drawing.Color]::FromArgb([Math]::Max(0,[Math]::Min(255,$f[2]+$j)), [Math]::Max(0,[Math]::Min(255,$f[3]+$j)), [Math]::Max(0,[Math]::Min(255,$f[4]+$j))))
      $mask[$f[0], $f[1]] = $false
    }
    if ($fill.Count -eq 0) { break }
  }
  # tiny embroidered TL, drawn at 4x then scaled down for soft edges
  $size = [Math]::Max(8, [int]($h * 0.55))
  $tile = New-Object System.Drawing.Bitmap ($size * 4), ($size * 4)
  $tg = [System.Drawing.Graphics]::FromImage($tile); $tg.SmoothingMode = 'AntiAlias'; $tg.Clear([System.Drawing.Color]::Transparent)
  $u = $size * 4 / 64.0
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, 176, 152, 104))
  foreach ($r in @(@(8,13,28,6),@(19,19,6.5,32),@(30.5,13,6.5,38),@(30.5,45,25,6))) {
    $tg.FillRectangle($brush, [float]($r[0]*$u), [float]($r[1]*$u), [float]($r[2]*$u), [float]($r[3]*$u)) }
  $tg.Dispose()
  $gg = [System.Drawing.Graphics]::FromImage($bmp); $gg.InterpolationMode = 'HighQualityBicubic'; $gg.CompositingQuality = 'HighQuality'
  $cx = $x0 + [int](($w - $size) / 2); $cy = $y0 + [int](($h - $size) / 2)
  $gg.DrawImage($tile, (New-Object System.Drawing.Rectangle $cx, $cy, $size, $size)); $gg.Dispose(); $tile.Dispose()
}
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 92L
$bmp.Save($Out, $enc, $ep); $bmp.Dispose()
"saved $Out"
