# Generates brand PNGs (transparent), OG image and watermarked photos.
# Usage: powershell -File scripts\brand.ps1 -Src <folder with original photos>
param([string]$Src = "C:\Users\pejsa\transferlux\img")
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$brand = Join-Path $root "public\brand"; $imgOut = Join-Path $root "public\img"
New-Item -ItemType Directory -Force $brand, $imgOut | Out-Null

# TL monogram: T bar + shared stem + L foot (same geometry as tl-mark.svg, 64 units)
function MarkPath([float]$x, [float]$y, [float]$s) {
  $u = $s / 64.0
  $rects = @(@(8,13,28,5),@(19.5,18,5,33),@(31,13,5,38),@(31,46,25,5))
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.FillMode = 'Winding'
  foreach ($r in $rects) { $p.AddRectangle((New-Object System.Drawing.RectangleF ($x + $r[0]*$u), ($y + $r[1]*$u), ($r[2]*$u), ($r[3]*$u))) }
  return $p
}
$gold = [System.Drawing.Color]::FromArgb(255, 201, 169, 106)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

function SaveMark($size, $color, $name, $bg) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.SmoothingMode = 'AntiAlias'
  if ($bg) { $g.Clear($bg) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $g.FillPath((New-Object System.Drawing.SolidBrush $color), (MarkPath 0 0 $size))
  $bmp.Save((Join-Path $brand $name), [System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
}
SaveMark 512 $gold "tl-mark-gold-512.png" $null
SaveMark 512 $white "tl-mark-white-512.png" $null
SaveMark 192 $gold "icon-192.png" ([System.Drawing.Color]::FromArgb(255, 11, 11, 12))
SaveMark 512 $gold "icon-512.png" ([System.Drawing.Color]::FromArgb(255, 11, 11, 12))
SaveMark 180 $gold "apple-touch-icon.png" ([System.Drawing.Color]::FromArgb(255, 11, 11, 12))

# Watermarked photos: small white TL mark, top left, discreet
function Watermark($in, $out, $maxW) {
  $src = [System.Drawing.Image]::FromFile($in)
  $w = [Math]::Min($maxW, $src.Width); $h = [int]($src.Height * $w / $src.Width)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
  $g.DrawImage($src, 0, 0, $w, $h)
  $m = [Math]::Max(22, [int]($w * 0.055)); $pad = [int]($w * 0.03)
  $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(70, 0, 0, 0))), (MarkPath ($pad + 1) ($pad + 1) $m))
  $g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(170, 255, 255, 255))), (MarkPath $pad $pad $m))
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 84L
  $bmp.Save($out, $enc, $ep); $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}
Get-ChildItem $Src -Filter *.jpg | Where-Object { $_.Name -ne "team-drivers.jpg" } | ForEach-Object {
  Watermark $_.FullName (Join-Path $imgOut $_.Name) 1280
  Watermark $_.FullName (Join-Path $imgOut ($_.BaseName + "-640.jpg")) 640
}
"brand + photos done"
