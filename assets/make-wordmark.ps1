# Extract tight, transparent wordmark crops from logo.png
Add-Type -AssemblyName System.Drawing

$inPath = "d:\Downloads\Antigravity Projects\NovoExim website\V2\assets\logo.png"
$outWordmark     = "d:\Downloads\Antigravity Projects\NovoExim website\V2\assets\logo-wordmark.png"
$outWordmarkFull = "d:\Downloads\Antigravity Projects\NovoExim website\V2\assets\logo-wordmark-full.png"

$bmp = New-Object System.Drawing.Bitmap($inPath)
$w = $bmp.Width; $h = $bmp.Height
Write-Output "SRC-SIZE $w x $h"

$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = [Math]::Abs($data.Stride)
$bytes = New-Object byte[] ($stride * $h)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$bmp.UnlockBits($data)

# Background color = average of four corners
$i1 = 0
$i2 = ($w - 1) * 4
$i3 = ($h - 1) * $stride
$i4 = $i3 + (($w - 1) * 4)
$bSum = [int64]$bytes[$i1] + [int64]$bytes[$i2] + [int64]$bytes[$i3] + [int64]$bytes[$i4]
$gSum = [int64]$bytes[$i1+1] + [int64]$bytes[$i2+1] + [int64]$bytes[$i3+1] + [int64]$bytes[$i4+1]
$rSum = [int64]$bytes[$i1+2] + [int64]$bytes[$i2+2] + [int64]$bytes[$i3+2] + [int64]$bytes[$i4+2]
$aSum = [int64]$bytes[$i1+3] + [int64]$bytes[$i2+3] + [int64]$bytes[$i3+3] + [int64]$bytes[$i4+3]
$bgB = [int]($bSum/4); $bgG = [int]($gSum/4); $bgR = [int]($rSum/4)
Write-Output "CORNER-ALPHA-RAW $aSum"
Write-Output "BG rgb($bgR,$bgG,$bgB)"

$T1 = 26; $T2 = 115   # alpha ramp thresholds on channel-diff sum
$bgTransparent = (($aSum / 4) -lt 128)   # corners already alpha=0 → keep existing alpha
$rowCount = New-Object int[] $h
$colCount = New-Object int[] $w

for ($y = 0; $y -lt $h; $y++) {
  $rowOff = $y * $stride
  for ($x = 0; $x -lt $w; $x++) {
    $i = $rowOff + $x * 4
    if (-not $bgTransparent) {
      $d = [Math]::Abs([int]$bytes[$i] - $bgB) + [Math]::Abs([int]$bytes[$i+1] - $bgG) + [Math]::Abs([int]$bytes[$i+2] - $bgR)
      if ($d -le $T1) {
        $bytes[$i] = 0; $bytes[$i+1] = 0; $bytes[$i+2] = 0; $bytes[$i+3] = 0
      } elseif ($d -lt $T2) {
        $a = [byte](255 * ($d - $T1) / ($T2 - $T1))
        # premultiply for GDI+ Format32bppArgb
        $bytes[$i]   = [byte]([int]$bytes[$i]   * $a / 255)
        $bytes[$i+1] = [byte]([int]$bytes[$i+1] * $a / 255)
        $bytes[$i+2] = [byte]([int]$bytes[$i+2] * $a / 255)
        $bytes[$i+3] = $a
      } else {
        $bytes[$i+3] = 255
      }
    }
    if ($bytes[$i+3] -gt 40) { $rowCount[$y]++; $colCount[$x]++ }
  }
}
Write-Output "BG-TRANSPARENT $bgTransparent"

# Find row clusters (blocks of non-empty rows separated by >= 8 empty rows)
$clusters = @()
$inRun = $false; $runStart = 0
for ($y = 0; $y -lt $h; $y++) {
  if ($rowCount[$y] -gt 1 -and -not $inRun) { $inRun = $true; $runStart = $y }
  elseif ($rowCount[$y] -le 1 -and $inRun) {
    if (($y - $runStart) -gt 10) { $clusters += ,@($runStart, $y) }
    $inRun = $false
  }
}
if ($inRun) { $clusters += ,@($runStart, $h) }
Write-Output ("ROW-CLUSTERS " + ($clusters | ForEach-Object { "$($_[0])-$($_[1])" }) -join " | ")

function Get-ColBounds([int]$y0, [int]$y1) {
  $minX = $w; $maxX = 0
  for ($y = $y0; $y -lt $y1; $y++) {
    $rowOff = $y * $stride
    for ($x = 0; $x -lt $w; $x++) {
      if ($bytes[$rowOff + $x*4 + 3] -gt 40) { if ($x -lt $minX) { $minX = $x }; if ($x -gt $maxX) { $maxX = $x } }
    }
  }
  return @($minX, $maxX)
}

function Save-Crop([int]$x0, [int]$y0, [int]$x1, [int]$y1, [string]$path) {
  $pad = 4
  $x0 = [Math]::Max(0, $x0 - $pad); $y0 = [Math]::Max(0, $y0 - $pad)
  $x1 = [Math]::Min($w-1, $x1 + $pad); $y1 = [Math]::Min($h-1, $y1 + $pad)
  $cw = $x1 - $x0 + 1; $ch = $y1 - $y0 + 1
  $nb = New-Object System.Drawing.Bitmap($cw, $ch, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $nr = New-Object System.Drawing.Rectangle(0, 0, $cw, $ch)
  $nd = $nb.LockBits($nr, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $nstride = [Math]::Abs($nd.Stride)
  $nbytes = New-Object byte[] ($nstride * $ch)
  for ($y = 0; $y -lt $ch; $y++) {
    $srcOff = (($y0 + $y) * $stride) + ($x0 * 4)
    $dstOff = $y * $nstride
    [Array]::Copy($bytes, $srcOff, $nbytes, $dstOff, $cw * 4)
  }
  [System.Runtime.InteropServices.Marshal]::Copy($nbytes, 0, $nd.Scan0, $nbytes.Length)
  $nb.UnlockBits($nd)
  if (Test-Path $path) { Remove-Item $path -Force }
  $nb.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $nb.Dispose()
  Write-Output "SAVED $path ${cw}x${ch}"
}

if ($clusters.Count -ge 2) {
  # Biggest cluster = "NovoExim" line; union of all clusters = full lockup
  $big = $clusters | Sort-Object { $_[1] - $_[0] } | Select-Object -Last 1
  $cb = Get-ColBounds $big[0] $big[1]
  Save-Crop $cb[0] $big[0] $cb[1] ($big[1]-1) $outWordmark

  $fy0 = ($clusters | ForEach-Object { $_[0] } | Measure-Object -Minimum).Minimum
  $fy1 = ($clusters | ForEach-Object { $_[1] } | Measure-Object -Maximum).Maximum
  $cf = Get-ColBounds $fy0 $fy1
  Save-Crop $cf[0] $fy0 $cf[1] ($fy1-1) $outWordmarkFull
} elseif ($clusters.Count -eq 1) {
  $cb = Get-ColBounds $clusters[0][0] $clusters[0][1]
  Save-Crop $cb[0] $clusters[0][0] $cb[1] ($clusters[0][1]-1) $outWordmark
  Copy-Item $outWordmark $outWordmarkFull -Force
  Write-Output "SINGLE-CLUSTER fallback"
} else {
  Write-Output "NO-CLUSTERS-FOUND"
}

$bmp.Dispose()
Write-Output "DONE"
