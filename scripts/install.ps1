# Install Mito (mito-ai + mitosheet) into %USERPROFILE%\.mito\venv using uv.
# Run from PowerShell: irm https://... | iex   OR   .\install.ps1
# Requires: Windows. If execution policy blocks scripts, use:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1

$ErrorActionPreference = 'Stop'

$MitoHome = if ($env:MITO_HOME) { $env:MITO_HOME } else { Join-Path $env:USERPROFILE '.mito' }
$VenvPath = Join-Path $MitoHome 'venv'
$BinDir = Join-Path $MitoHome 'bin'
$MitoCli = Join-Path $BinDir 'mito.cmd'
$MitoPythonVersion = if ($env:MITO_PYTHON_VERSION) { $env:MITO_PYTHON_VERSION } else { '3.11' }
$Packages = @('mito-ai', 'mitosheet')

function Write-Die {
  param([string]$Message)
  Write-Error "mito-install: $Message"
  exit 1
}

function Test-Windows {
  if ($env:OS -ne 'Windows_NT') {
    Write-Die 'This installer only supports Windows. On other systems, use scripts/install.sh (macOS) or: python -m pip install mito-ai mitosheet'
  }
}

function Get-SystemPython {
  foreach ($name in @('python3', 'python')) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) { continue }
    $p = Start-Process -FilePath $cmd.Source -ArgumentList @(
      '-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'
    ) -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -eq 0) { return $cmd.Source }
  }
  return $null
}

function Ensure-Uv {
  if (Get-Command uv -ErrorAction SilentlyContinue) { return }

  Write-Host 'uv not found; installing from astral.sh ...'
  $localBin = Join-Path $env:USERPROFILE '.local\bin'
  $cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
  $env:Path = "$localBin;$cargoBin;$env:Path"

  try {
    Invoke-Expression (Invoke-RestMethod -Uri 'https://astral.sh/uv/install.ps1')
  } catch {
    Write-Warning "mito-install: uv install reported an error. Checking for uv ... ($($_.Exception.Message))"
  }

  if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Die 'uv is not on PATH after install. Add %USERPROFILE%\.local\bin to PATH and run this script again.'
  }
}

function Install-Venv {
  $pyExe = Join-Path $VenvPath 'Scripts\python.exe'

  Write-Host "Creating virtual environment at $VenvPath ..."
  if (Test-Path $VenvPath) {
    Remove-Item -LiteralPath $VenvPath -Recurse -Force
  }

  if ($script:SystemPythonBin) {
    & uv venv $VenvPath --python $script:SystemPythonBin --no-project
  } else {
    Write-Host "System Python 3.9+ not found; downloading Python $MitoPythonVersion via uv ..."
    & uv venv $VenvPath --python $MitoPythonVersion --no-project
  }

  Write-Host "Installing $($Packages -join ' ') ..."
  & uv pip install --no-config --python $pyExe @Packages
}

function Install-MitoCli {
  $null = New-Item -ItemType Directory -Force -Path $BinDir

  $jupyter = [System.IO.Path]::GetFullPath((Join-Path $VenvPath 'Scripts\jupyter.exe'))
  $content = "@echo off`r`n`"$jupyter`" lab %*`r`n"
  Set-Content -LiteralPath $MitoCli -Value $content -Encoding ASCII
}

function Add-MitoToUserPath {
  $pathToAdd = [System.IO.Path]::GetFullPath($BinDir)
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $already = $false
  if (-not [string]::IsNullOrEmpty($userPath)) {
    foreach ($seg in $userPath -split ';') {
      if ([string]::IsNullOrWhiteSpace($seg)) { continue }
      try {
        if ([System.IO.Path]::GetFullPath($seg.Trim()) -eq $pathToAdd) {
          $already = $true
          break
        }
      } catch { }
    }
  }
  if (-not $already) {
    if ([string]::IsNullOrEmpty($userPath)) {
      [Environment]::SetEnvironmentVariable('Path', $pathToAdd, 'User')
    } else {
      [Environment]::SetEnvironmentVariable('Path', "$userPath;$pathToAdd", 'User')
    }
  }
  $env:Path = "$pathToAdd;$env:Path"
  return $true
}

function Write-Success {
  $pathOk = $false
  try {
    $pathOk = Add-MitoToUserPath
  } catch {
    Write-Warning "mito-install: could not update user PATH: $($_.Exception.Message)"
  }

  Write-Host ''
  Write-Host "Installed at: $VenvPath"
  if ($pathOk) {
    Write-Host 'User PATH was updated to include the Mito bin folder.'
  }
  Write-Host ''
  Write-Host 'NEXT STEPS' -ForegroundColor Green
  Write-Host ''
  Write-Host 'Congratulations! Mito is installed. One last thing:'
  Write-Host ''
  Write-Host '1) Close and reopen your terminal (or sign out/in) so PATH picks up mito.'
  Write-Host ''
  Write-Host '2) You can then launch Mito at any time by running:'
  Write-Host '   mito' -ForegroundColor Cyan
  Write-Host ''
  if (-not $pathOk) {
    Write-Host 'If mito is not found, add this folder to your PATH (one-time):'
    Write-Host "  $BinDir"
    Write-Host ''
  }
}

function Main {
  Test-Windows
  $script:SystemPythonBin = Get-SystemPython

  Ensure-Uv
  Install-Venv
  Install-MitoCli
  Write-Success
}

Main
