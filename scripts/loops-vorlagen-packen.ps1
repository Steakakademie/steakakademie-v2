# Packt die Loops-Mailvorlagen unter emails/loops/ als ZIP für den Upload in Loops.
# Je Vorlage: index.mjml + img/logo.png (Loops verlangt genau diese Struktur).
# Anleitung: docs/loops-mailvorlagen.md
#
# Aufruf (aus dem Repo-Wurzelverzeichnis):
#   powershell -ExecutionPolicy Bypass -File scripts/loops-vorlagen-packen.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/loops-vorlagen-packen.ps1 -Ziel C:\Temp\loops
#
# Ohne -Ziel landen die ZIPs in %TEMP%\loops-vorlagen (nicht im Repo).

param([string]$Ziel = (Join-Path $env:TEMP 'loops-vorlagen'))

$ErrorActionPreference = 'Stop'
$quelle = Join-Path $PSScriptRoot '..\emails\loops'
$logo = Join-Path $quelle 'img\logo.png'
if (-not (Test-Path $logo)) { throw "Logo fehlt: $logo" }
New-Item -ItemType Directory -Force $Ziel | Out-Null

# Bewusst nicht Compress-Archive: Windows PowerShell 5 schreibt Pfade mit
# Backslash (img\logo.png) in das ZIP. Loops entpackt auf einem Server, der den
# Ordner dann nicht erkennt — das Logo fehlt. Deshalb Einträge mit "/" anlegen.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$vorlagen = Get-ChildItem $quelle -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'index.mjml') }
foreach ($v in $vorlagen) {
  $zip = Join-Path $Ziel ($v.Name + '.zip')
  if (Test-Path $zip) { Remove-Item $zip -Confirm:$false }
  $archiv = [IO.Compression.ZipFile]::Open($zip, [IO.Compression.ZipArchiveMode]::Create)
  try {
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archiv, (Join-Path $v.FullName 'index.mjml'), 'index.mjml')
    [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archiv, $logo, 'img/logo.png')
  } finally {
    $archiv.Dispose()
  }
  Write-Host "gepackt: $zip"
}
