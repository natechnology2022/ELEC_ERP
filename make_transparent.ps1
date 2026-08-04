Add-Type -AssemblyName System.Drawing

$path = 'C:\Users\natec\.gemini\antigravity\scratch\machine-lifecycle-app\logo.png'
$origPath = 'C:\Users\natec\.gemini\antigravity\brain\56557890-d3e1-434d-b3d8-bf033bd46f46\.user_uploaded\media_1785834451292.png'

$img = [System.Drawing.Bitmap]::FromFile($origPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$img.Dispose()
$g.Dispose()

for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Check if pixel is white or near-white
        if ($pixel.R -gt 225 -and $pixel.G -gt 225 -and $pixel.B -gt 225) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Logo transparency conversion complete!"
